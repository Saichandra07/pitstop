package com.pitstop.pitstop_backend.auth;

import org.springframework.beans.factory.annotation.Value;
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

    @Value("${cors.allowed.origins}")
    private String allowedOrigins;

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
                                .requestMatchers(
                                        "/api/auth/register",
                                        "/api/auth/login",
                                        "/api/admin/setup",
                                        "/api/auth/forgot-password",
                                        "/api/auth/reset-password",
                                        "/api/auth/verify-email",
                                        "/ws/**"   // SockJS WebSocket handshake
                                ).permitAll()
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")
// ... other rules
                        // ── ADMIN only ──────────────────────────────────────────────
                        // Full job list + delete
                        .requestMatchers(HttpMethod.GET, "/api/jobs").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/jobs/**").hasRole("ADMIN")

                        // ── MECHANIC only ───────────────────────────────────────────
                        // Broadcast feed — see all PENDING jobs
                        .requestMatchers(HttpMethod.GET, "/api/jobs/pending").hasRole("MECHANIC")
                        // Broadcast polling — get the job currently sent to this mechanic
                        .requestMatchers(HttpMethod.GET, "/api/jobs/broadcast/pending").hasRole("MECHANIC")
                        // Mechanic's own completed job history and current active job
                        .requestMatchers(HttpMethod.GET, "/api/jobs/mechanic/history").hasRole("MECHANIC")
                        .requestMatchers(HttpMethod.GET, "/api/jobs/mechanic/active").hasRole("MECHANIC")
                        // Accept / decline a broadcast job
                        .requestMatchers(HttpMethod.POST, "/api/jobs/*/accept").hasRole("MECHANIC")
                        .requestMatchers(HttpMethod.POST, "/api/jobs/*/decline").hasRole("MECHANIC")
                        .requestMatchers(HttpMethod.POST, "/api/jobs/*/mechanic-abandon").hasRole("MECHANIC")
                        // Push job status forward (IN_PROGRESS, COMPLETED)
                        .requestMatchers(HttpMethod.PATCH, "/api/jobs/*/status").hasRole("MECHANIC")
                        // Availability toggle
                        .requestMatchers(HttpMethod.PATCH, "/api/accounts/availability").hasRole("MECHANIC")
                        // Restricts PATCH requests to /api/accounts/expertise to users with the MECHANIC role.
                        .requestMatchers(HttpMethod.PATCH, "/api/accounts/expertise").hasRole("MECHANIC")
                        // Profile photo upload — MECHANIC only
                        .requestMatchers(HttpMethod.POST, "/api/accounts/profile-photo").hasRole("MECHANIC")
                        // Heartbeat ping during active job — MECHANIC only
                        .requestMatchers(HttpMethod.POST, "/api/mechanic/heartbeat").hasRole("MECHANIC")
                        // Continuous location refresh while online — MECHANIC only
                        .requestMatchers(HttpMethod.PATCH, "/api/mechanic/location").hasRole("MECHANIC")
                        // Appeal submission — MECHANIC only
                        .requestMatchers(HttpMethod.POST, "/api/accounts/appeal").hasRole("MECHANIC")

                        // ── USER only ───────────────────────────────────────────────
                        // Nearby mechanics count for dashboard map tile
                        .requestMatchers(HttpMethod.GET, "/api/accounts/nearby-mechanics-count").hasRole("USER")
                        // Update phone number
                        .requestMatchers(HttpMethod.PATCH, "/api/accounts/phone").hasRole("USER")
                        // Submit SOS
                        .requestMatchers(HttpMethod.POST, "/api/jobs/sos").hasRole("USER")
                        // Submit a review after job completion
                        .requestMatchers(HttpMethod.POST, "/api/jobs/*/review").hasRole("USER")
                        // Submit a report during or after a job
                        .requestMatchers(HttpMethod.POST, "/api/jobs/*/report").hasRole("USER")
                        // Cancel their own job
                        .requestMatchers(HttpMethod.PATCH, "/api/jobs/*/cancel").hasRole("USER")
                        // Mutual confirmation — user confirms or rejects mechanic's status requests
                        .requestMatchers(HttpMethod.POST, "/api/jobs/*/confirm-arrival").hasRole("USER")
                        .requestMatchers(HttpMethod.POST, "/api/jobs/*/reject-arrival").hasRole("USER")
                        .requestMatchers(HttpMethod.POST, "/api/jobs/*/confirm-complete").hasRole("USER")
                        .requestMatchers(HttpMethod.POST, "/api/jobs/*/reject-complete").hasRole("USER")
                        // Their job feeds
                        .requestMatchers(HttpMethod.GET, "/api/jobs/my/**").hasRole("USER")

                        // ── ADMIN catch-alls (IDOR guard) ───────────────────────────
                        // Generic GET /api/jobs/{id} and /api/jobs/mechanic/{mechanicProfileId}
                        // must be ADMIN-only — any authenticated user could scrape GPS/photo of any job.
                        // All role-specific read endpoints are defined above and take precedence.
                        .requestMatchers(HttpMethod.GET, "/api/jobs/*").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/jobs/mechanic/*").hasRole("ADMIN")

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
        config.setAllowedOrigins(List.of(allowedOrigins.split(",")));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}