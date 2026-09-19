package co.clinicmascotas.api.config;

import java.util.List;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app")
public record AppProperties(Clinic clinic, Cors cors, Jwt jwt, Admin admin, Seed seed) {

    public record Clinic(String name, String email, String phone, String address, String mapsUrl,
                         long consultationPrice, String currency, String timeZone, int bookingDaysAhead) {
    }

    public record Cors(List<String> allowedOrigins) {
    }

    public record Jwt(String secret, long expirationMinutes) {
    }

    public record Admin(String email, String password, String name) {
    }

    public record Seed(boolean demoData) {
    }
}
