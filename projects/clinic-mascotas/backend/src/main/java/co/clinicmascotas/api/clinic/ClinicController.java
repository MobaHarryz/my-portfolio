package co.clinicmascotas.api.clinic;

import java.util.Arrays;
import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import co.clinicmascotas.api.config.AppProperties;

/** Public, read-only information the booking wizard needs before it starts. */
@RestController
@RequestMapping("/api/clinic")
public class ClinicController {

    public static final List<String> AGE_RANGES = List.of(
            "Menos de 1 año", "1 a 3 años", "4 a 7 años", "8 a 11 años", "12 años o más");

    private final AppProperties.Clinic clinic;

    public ClinicController(AppProperties properties) {
        this.clinic = properties.clinic();
    }

    public record PetTypeResponse(PetType id, String label, List<String> breeds) {
    }

    public record ClinicInfoResponse(String name, String email, String phone, String address, String mapsUrl,
                                     long consultationPrice, String currency, List<PetTypeResponse> petTypes,
                                     List<String> ageRanges) {
    }

    @GetMapping
    public ClinicInfoResponse info() {
        List<PetTypeResponse> petTypes = Arrays.stream(PetType.values())
                .map(type -> new PetTypeResponse(type, type.getLabel(), type.getBreeds()))
                .toList();

        return new ClinicInfoResponse(clinic.name(), clinic.email(), clinic.phone(), clinic.address(),
                clinic.mapsUrl(), clinic.consultationPrice(), clinic.currency(), petTypes, AGE_RANGES);
    }
}
