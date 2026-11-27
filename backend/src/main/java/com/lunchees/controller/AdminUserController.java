package com.lunchees.controller;

import com.lunchees.model.AppUser;
import com.lunchees.repository.AppUserRepository;
import java.util.List;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/users")
public class AdminUserController {
    private final AppUserRepository userRepository;

    public AdminUserController(AppUserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping
    public List<AppUser> listUsers() {
        return userRepository.findAllByOrderByRoleAscUsernameAsc();
    }
}