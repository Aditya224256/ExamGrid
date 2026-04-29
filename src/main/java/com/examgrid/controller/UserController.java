package com.examgrid.controller;

import com.examgrid.model.User;
import com.examgrid.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private com.examgrid.util.JwtUtil jwtUtil;

    @PostMapping("/login")
    public Map<String, Object> login(@RequestBody User loginUser) {
        Optional<User> user = userRepository.findByUsernameAndPasswordAndRole(
            loginUser.username, loginUser.password, loginUser.role
        );
        
        Map<String, Object> response = new HashMap<>();
        if (user.isPresent()) {
            String token = jwtUtil.generateToken(user.get().username);
            response.put("success", true);
            response.put("user", user.get());
            response.put("token", token);
        } else {
            response.put("success", false);
            response.put("message", "Invalid credentials");
        }
        return response;
    }

    @PostMapping("/signup")
    public Map<String, Object> signup(@RequestBody User newUser) {
        Map<String, Object> response = new HashMap<>();
        
        Optional<User> existing = userRepository.findByUsernameAndRole(newUser.username, newUser.role);
        if (existing.isPresent()) {
            response.put("success", false);
            response.put("message", "User already exists for this role.");
            return response;
        }

        userRepository.save(newUser);
        response.put("success", true);
        response.put("message", "Account created successfully!");
        return response;
    }
}
