package com.ecotrack.backend.service;

import com.ecotrack.backend.entity.User;
import com.ecotrack.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class OAuthService {

    private final UserRepository userRepository;

    public User saveOAuthUser(String email, String name) {

        Optional<User> existingUser = userRepository.findByEmail(email);

        if (existingUser.isPresent()) {
            return existingUser.get();
        }

        User newUser = User.builder()
                .email(email)
                .name(name)
                .password("OAUTH_USER") // dummy password
                .role("USER")
                .createdAt(LocalDateTime.now())
                .build();

        return userRepository.save(newUser);
    }
}