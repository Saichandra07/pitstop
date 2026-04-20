package com.pitstop.pitstop_backend.auth;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtFilter jwtFilter;

    public SecurityConfig(JwtFilter jwtFilter) {
        this.jwtFilter = jwtFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        http
                .cors(Customizer.withDefaults())
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth

                        // ── Public ──────────────────────────────────────────────────
                        .requestMatchers("/api/auth/register", "/api/auth/login", "/api/admin/setup").permitAll()
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")
// ... other rules
                        // ── ADMIN only ──────────────────────────────────────────────
                        // Full job list + delete
                        .requestMatchers(HttpMethod.GET, "/api/jobs").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/jobs/**").hasRole("ADMIN")

                        // ── MECHANIC only ───────────────────────────────────────────
                        // Broadcast feed — see all PENDING jobs
                        .requestMatchers(HttpMethod.GET, "/api/jobs/pending").hasRole("MECHANIC")
                        // Accept a job
                        .requestMatchers(HttpMethod.POST, "/api/jobs/*/assign").hasRole("MECHANIC")
                        // Push job status forward (IN_PROGRESS, COMPLETED)
                        .requestMatchers(HttpMethod.PATCH, "/api/jobs/*/status").hasRole("MECHANIC")
                        // Availability toggle
                        .requestMatchers(HttpMethod.PATCH, "/api/accounts/availability").hasRole("MECHANIC")
                        // Restricts PATCH requests to /api/accounts/expertise to users with the MECHANIC role.
                        .requestMatchers(HttpMethod.PATCH, "/api/accounts/expertise").hasRole("MECHANIC")

                        // ── USER only ───────────────────────────────────────────────
                        // Submit SOS
                        .requestMatchers(HttpMethod.POST, "/api/jobs/sos").hasRole("USER")
                        // Cancel their own job
                        .requestMatchers(HttpMethod.PATCH, "/api/jobs/*/cancel").hasRole("USER")
                        // Their job feeds
                        .requestMatchers(HttpMethod.GET, "/api/jobs/my/**").hasRole("USER")

                        // ── Any authenticated ───────────────────────────────────────
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of("http://localhost:5173"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}