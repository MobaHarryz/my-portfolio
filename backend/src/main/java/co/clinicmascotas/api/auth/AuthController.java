package co.clinicmascotas.api.auth;

import java.time.Clock;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import co.clinicmascotas.api.common.ApiException;
import co.clinicmascotas.api.config.AppProperties;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;

@RestController
public class AuthController {

    public record LoginRequest(@NotBlank String email, @NotBlank String password) {
    }

    public record LoginResponse(String token, Instant expiresAt, String name, String email) {
    }

    public record MeResponse(String name, String email, List<String> roles) {
    }

    private final AdminUserRepository users;
    private final PasswordEncoder passwordEncoder;
    private final JwtEncoder jwtEncoder;
    private final AppProperties.Jwt jwt;
    private final Clock clock;

    public AuthController(AdminUserRepository users, PasswordEncoder passwordEncoder, JwtEncoder jwtEncoder,
                          AppProperties properties, Clock clock) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
        this.jwtEncoder = jwtEncoder;
        this.jwt = properties.jwt();
        this.clock = clock;
    }

    @PostMapping("/api/auth/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest request) {
        AdminUser user = users.findByEmail(request.email().trim().toLowerCase())
                .filter(found -> passwordEncoder.matches(request.password(), found.getPasswordHash()))
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Correo o contraseña incorrectos."));

        Instant now = clock.instant();
        Instant expiresAt = now.plus(jwt.expirationMinutes(), ChronoUnit.MINUTES);
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer("clinic-mascotas-api")
                .subject(user.getEmail())
                .issuedAt(now)
                .expiresAt(expiresAt)
                .claim("name", user.getName())
                .claim("roles", List.of(user.getRole()))
                .build();

        String token = jwtEncoder.encode(JwtEncoderParameters.from(JwsHeader.with(MacAlgorithm.HS256).build(), claims))
                .getTokenValue();
        return new LoginResponse(token, expiresAt, user.getName(), user.getEmail());
    }

    @GetMapping("/api/admin/me")
    public MeResponse me(@AuthenticationPrincipal Jwt principal) {
        return new MeResponse(principal.getClaimAsString("name"), principal.getSubject(),
                principal.getClaimAsStringList("roles"));
    }
}
