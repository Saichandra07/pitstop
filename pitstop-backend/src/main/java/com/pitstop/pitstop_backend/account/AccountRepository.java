package com.pitstop.pitstop_backend.account;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface AccountRepository extends JpaRepository<Account, Long> {
    Optional<Account> findByEmail(String email);
    boolean existsByEmail(String email);
    boolean existsByRole(Role role);
    List<Account> findByRole(Role role);

    @Query("SELECT a FROM Account a WHERE a.role = :role AND " +
            "LOWER(a.name) LIKE LOWER(CONCAT('%', :search, '%'))")
    List<Account> searchUsersByName(@Param("role") Role role, @Param("search") String search);
}
