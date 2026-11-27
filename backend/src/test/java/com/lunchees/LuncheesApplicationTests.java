package com.lunchees;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest
@AutoConfigureMockMvc
class LuncheesApplicationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private String loginAndGetToken(String username, String password) throws Exception {
        MvcResult res = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                java.util.Map.of("username", username, "password", password))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andReturn();
        JsonNode root = objectMapper.readTree(res.getResponse().getContentAsString());
        return root.get("token").asText();
    }

    @Test
    void healthAndRoleAuthWork() throws Exception {
        mockMvc.perform(get("/api/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"));

        mockMvc.perform(get("/api/coupons"))
                .andExpect(status().isUnauthorized());

        String studentToken = loginAndGetToken("student", "student123");
        mockMvc.perform(get("/api/admin/users")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void fullCouponPaymentAndQrScanFlow() throws Exception {
        // 1. Expired student cannot claim coupon until renewing
        String expiredToken = loginAndGetToken("student2", "student123");
        mockMvc.perform(post("/api/student/coupon/claim")
                        .header("Authorization", "Bearer " + expiredToken))
                .andExpect(status().isForbidden());

        // 2. Expired student pays to renew monthly subscription
        mockMvc.perform(post("/api/payments/renew")
                        .header("Authorization", "Bearer " + expiredToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"planCode\":\"MONTHLY\",\"paymentMethod\":\"UPI\",\"paymentReference\":\"priya@okaxis\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.payment.status").value("SUCCESS"))
                .andExpect(jsonPath("$.user.subscriptionActive").value(true));

        // 3. Renewed student claims today's QR coupon
        MvcResult claimRes = mockMvc.perform(post("/api/student/coupon/claim")
                        .header("Authorization", "Bearer " + expiredToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.coupon.code").isNotEmpty())
                .andExpect(jsonPath("$.coupon.qrPayload").isNotEmpty())
                .andReturn();
        String qrPayload = objectMapper.readTree(claimRes.getResponse().getContentAsString())
                .get("coupon").get("qrPayload").asText();

        // 4. Mess staff scans QR payload at counter and redeems coupon
        String staffToken = loginAndGetToken("staff", "staff123");
        mockMvc.perform(post("/api/coupons/redeem")
                        .header("Authorization", "Bearer " + staffToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(java.util.Map.of("qrData", qrPayload))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("REDEEMED"))
                .andExpect(jsonPath("$.redeemedBy").value("staff"));

        // 5. Re-scanning the same QR fails with 409 Conflict
        mockMvc.perform(post("/api/coupons/redeem")
                        .header("Authorization", "Bearer " + staffToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(java.util.Map.of("qrData", qrPayload))))
                .andExpect(status().isConflict());

        // 6. Admin can generate active coupons and view payments
        String adminToken = loginAndGetToken("admin", "admin123");
        mockMvc.perform(post("/api/coupons/generate-active")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.eligibleStudents").exists());

        mockMvc.perform(get("/api/payments")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalTransactions").isNumber());
    }
}
