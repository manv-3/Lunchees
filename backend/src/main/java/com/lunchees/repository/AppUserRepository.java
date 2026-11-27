package com.lunchees.repository;

import com.lunchees.model.AppUser;
import com.lunchees.model.Role;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AppUserRepository extends JpaRepository<AppUser, Long> {
    Optional<AppUser> findByUsernameIgnoreCase(String username);
    Optional<AppUser> findByMemberIdIgnoreCase(String memberId);
    boolean existsByUsernameIgnoreCase(String username);
    boolean existsByMemberIdIgnoreCase(String memberId);
    List<AppUser> findByRoleOrderByMemberIdAsc(Role role);
    List<AppUser> findAllByOrderByRoleAscUsernameAsc();
}
