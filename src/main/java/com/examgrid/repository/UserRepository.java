package com.examgrid.repository;

import com.examgrid.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsernameAndPasswordAndRole(String username, String password, String role);
    Optional<User> findByUsernameAndRole(String username, String role);
}
