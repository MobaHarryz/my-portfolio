package co.clinicmascotas.api.auth;

import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;

public interface AdminUserRepository extends MongoRepository<AdminUser, String> {

    Optional<AdminUser> findByEmail(String email);
}
