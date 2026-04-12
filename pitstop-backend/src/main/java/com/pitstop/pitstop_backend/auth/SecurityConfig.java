package com.pitstop.pitstop_backend.auth;

import com.pitstop.pitstop_backend.auth.JwtFilter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
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

    @Autowired
    private JwtFilter jwtFilter;

    // constructor injection instead of @Autowired field injection
    // more explicit, easier to test, avoids some circular dependency scenarios
    public SecurityConfig(JwtFilter jwtFilter){
        this.jwtFilter = jwtFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception{

        http
                .cors(Customizer.withDefaults())
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth

                        // new unified auth endpoints — old /api/users and /api/mechanics auth routes are dead
                        .requestMatchers("/api/auth/register", "/api/auth/login").permitAll()

                        // SOS open to any authenticated account — USER or MECHANIC both can call for help
                        .requestMatchers("/api/jobs/sos").authenticated()

                        // mechanic-only endpoints — VERIFIED check happens in service layer
                        // SecurityConfig only checks role here, not verificationStatus
                        .requestMatchers("/api/mechanics/**").hasRole("MECHANIC")

                        // job management — mechanics accept/update jobs
                        .requestMatchers("/api/jobs/*/accept").hasRole("MECHANIC")
                        .requestMatchers("/api/jobs/*/complete").hasRole("MECHANIC")

                        // everything else requires authentication, any role
                        .anyRequest().authenticated()
                ) .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
    @Bean
    public PasswordEncoder passwordEncoder(){
        return new BCryptPasswordEncoder();
    }
    @Bean
    public CorsConfigurationSource corsConfigurationSource(){
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
