package com.cabxpress.repository;

import com.cabxpress.entity.User;
import com.cabxpress.enums.Role;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    List<User> findByRoleAndEnabledTrue(Role role);
    boolean existsByEmail(String email);
}
