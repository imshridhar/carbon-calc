package com.ecotrack.backend.config;

import com.ecotrack.backend.security.JwtFilter;
import com.ecotrack.backend.security.JwtUtil;
import com.ecotrack.backend.service.AuthService;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.web.DefaultOAuth2AuthorizationRequestResolver;
import org.springframework.security.oauth2.client.web.OAuth2AuthorizationRequestResolver;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.util.UriComponentsBuilder;
import java.util.List;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {
    private final JwtUtil jwtUtil;
    private final JwtFilter jwtFilter;
    private final AuthService authService;
    private final ClientRegistrationRepository clientRegistrationRepository;

    @Value("${spring.security.oauth2.client.registration.google.client-id:placeholder}")
    private String googleClientId;

    @Value("${spring.security.oauth2.client.registration.github.client-id:placeholder}")
    private String githubClientId;

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    @Value("${app.backend-url:http://localhost:8085}")
    private String backendUrl;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .exceptionHandling(ex -> ex.authenticationEntryPoint((req, res, e) ->
                res.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Unauthorized")))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(
                    "/api/auth/register",
                    "/api/auth/verify-otp",
                    "/api/auth/resend-otp",
                    "/api/auth/login",
                    "/api/auth/forgot-password",
                    "/api/auth/reset-password",
                    "/api/otp/**",
                    "/oauth2/**",
                    "/login/oauth2/**",
                    "/error"
                ).permitAll()
                .anyRequest().authenticated())
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        // Only enable OAuth2 login if at least one provider is configured.
        if (isConfigured(googleClientId) || isConfigured(githubClientId)) {
            http.oauth2Login(oauth -> oauth
                .authorizationEndpoint(endpoint -> endpoint.authorizationRequestResolver(authorizationRequestResolver()))
                .successHandler((req, res, auth) -> {
                    OAuth2User u = (OAuth2User) auth.getPrincipal();
                    String email = u.getAttribute("email");
                    String name = u.getAttribute("name");
                    if (email == null) {
                        // GitHub may not return email directly via OAuth2User
                        email = u.getAttribute("login") + "@github.user";
                        name = u.getAttribute("login");
                    }
                    var user = authService.saveOAuthUser(email, name);
                    String token = jwtUtil.generateToken(user.getEmail());
                    String redirectUrl = UriComponentsBuilder.fromUriString(frontendUrl)
                        .path("/oauth-success")
                        .queryParam("token", token)
                        .queryParam("name", user.getName())
                        .queryParam("email", user.getEmail())
                        .queryParam("role", user.getRole())
                        .queryParam("id", user.getId())
                        .build()
                        .encode()
                        .toUriString();
                    res.sendRedirect(redirectUrl);
                }));
        }

        return http.build();
    }

    private boolean isConfigured(String clientId) {
        return clientId != null && !clientId.isBlank() && !"placeholder".equals(clientId);
    }

    private OAuth2AuthorizationRequestResolver authorizationRequestResolver() {
        DefaultOAuth2AuthorizationRequestResolver defaultResolver =
            new DefaultOAuth2AuthorizationRequestResolver(clientRegistrationRepository, "/oauth2/authorization");

        return new OAuth2AuthorizationRequestResolver() {
            @Override
            public OAuth2AuthorizationRequest resolve(jakarta.servlet.http.HttpServletRequest request) {
                return customize(defaultResolver.resolve(request), request);
            }

            @Override
            public OAuth2AuthorizationRequest resolve(jakarta.servlet.http.HttpServletRequest request, String clientRegistrationId) {
                return customize(defaultResolver.resolve(request, clientRegistrationId), clientRegistrationId);
            }
        };
    }

    private OAuth2AuthorizationRequest customize(OAuth2AuthorizationRequest request, jakarta.servlet.http.HttpServletRequest httpRequest) {
        if (request == null) {
            return null;
        }
        String requestUri = httpRequest.getRequestURI();
        String registrationId = requestUri.substring(requestUri.lastIndexOf('/') + 1);
        return customize(request, registrationId);
    }

    private OAuth2AuthorizationRequest customize(OAuth2AuthorizationRequest request, String registrationId) {
        if (request == null) {
            return null;
        }
        String redirectUri = UriComponentsBuilder.fromUriString(backendUrl)
            .path("/login/oauth2/code/")
            .path(registrationId)
            .build()
            .toUriString();
        return OAuth2AuthorizationRequest.from(request)
            .redirectUri(redirectUri)
            .build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration cfg = new CorsConfiguration();
        cfg.setAllowedOrigins(List.of(frontendUrl));
        cfg.setAllowedMethods(List.of("GET","POST","PUT","PATCH","DELETE","OPTIONS"));
        cfg.setAllowedHeaders(List.of("Authorization","Content-Type","Cache-Control"));
        cfg.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource src = new UrlBasedCorsConfigurationSource();
        src.registerCorsConfiguration("/**", cfg);
        return src;
    }
}
