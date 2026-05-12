package com.pitstop.pitstop_backend.auth;

import com.pitstop.pitstop_backend.account.Role;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;

@Component
public class JwtUtil {

    @Value("${jwt.secret}")
    private String SECRET_KEY;
    private final long EXPIRATION_MS = 1000*60*60*10;


    public String generateToken(String email, Long accountId, Role role){
        return Jwts.builder()
                .setSubject(email)
                .claim("accountId", accountId)
                .claim("role", role.name())
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis()+EXPIRATION_MS))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();

    }
    private Key getSigningKey(){
        byte[] keyBytes = SECRET_KEY.getBytes(StandardCharsets.UTF_8);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    //internal helper - parses and return the full claims body
    //private because callers should use the specific extractors below , not raw claims
    private Claims extractAllClaims(String token){
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    public String extractEmail(String token){
        return extractAllClaims(token).getSubject();
    }

    //returns the accountId stored in the token - used in every protected endpoint
    // so services never trust accountId from the request body
    public Long extractAccountId(String token){
        return extractAllClaims(token).get("accountId", Long.class);
    }

    //returns the Role enum - used by SecurityConfig and service-layer ownership checks
    public Role extractRole(String token){
        String roleString = extractAllClaims(token).get("role", String.class);
        return Role.valueOf(roleString); // converts "MECHANIC" back to Role.MECHANIC
    }

    public boolean isTokenValid(String token){
        try {
            extractAllClaims(token);
            return true;
        }catch (Exception e){
            return false;
        }
    }

}
