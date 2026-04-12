package com.pitstop.pitstop_backend.auth;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
public class JwtFilter extends OncePerRequestFilter {

    @Lazy // prevents circular dependency between JwtFilter and SecurityConfig
    @Autowired
    private JwtUtil jwtUtil;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
        throws ServletException, IOException{

        String authHeader = request.getHeader("Authorization");

        if(authHeader !=null && authHeader.startsWith("Bearer ")){
            String token = authHeader.substring(7);

            if (jwtUtil.isTokenValid(token)){

                // extract accountId — this becomes the principal
                // any service can now call getPrincipal() to get the caller's accountId
                // no DB call needed — it's right here in the token
                Long accountId = jwtUtil.extractAccountId(token);

                // extract role and wrap it as a GrantedAuthority
                // Spring Security reads authorities when enforcing .hasRole() rules
                // "ROLE_" prefix is required by Spring Security's hasRole() matcher
                String role = "ROLE_"+jwtUtil.extractRole(token).name();
                List<SimpleGrantedAuthority> authorities = List.of(new SimpleGrantedAuthority(role));

                // accountId as principal, authorities carry the role
                // any controller can now do:
                // Long id = (Long) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(accountId, null, authorities);

                SecurityContextHolder.getContext().setAuthentication(authentication);
            }
        }
        filterChain.doFilter(request,response);

    }

}
