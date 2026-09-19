package co.clinicmascotas.api.vet;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Set;

import co.clinicmascotas.api.clinic.PetType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public final class VeterinarianDtos {

    private VeterinarianDtos() {
    }

    /** What the public booking wizard sees. {@code nextAvailable} is null when the vet has no free slots. */
    public record VetSummary(String id, String fullName, String title, String university, String photoUrl,
                             Set<PetType> petTypes, LocalDate nextAvailable) {

        static VetSummary from(Veterinarian vet, LocalDate nextAvailable) {
            return new VetSummary(vet.getId(), vet.getFullName(), vet.getTitle(), vet.getUniversity(),
                    vet.getPhotoUrl(), vet.getPetTypes(), nextAvailable);
        }
    }

    /** Full record for the admin panel. */
    public record VetDetail(String id, String fullName, String title, String university, String photoUrl,
                            Set<PetType> petTypes, Map<DayOfWeek, List<String>> weeklySchedule, boolean active) {

        static VetDetail from(Veterinarian vet) {
            return new VetDetail(vet.getId(), vet.getFullName(), vet.getTitle(), vet.getUniversity(),
                    vet.getPhotoUrl(), vet.getPetTypes(), vet.getWeeklySchedule(), vet.isActive());
        }
    }

    public record VetRequest(
            @NotBlank(message = "El nombre es obligatorio") @Size(max = 80) String fullName,
            @NotBlank(message = "El cargo es obligatorio") @Size(max = 60) String title,
            @NotBlank(message = "La universidad es obligatoria") @Size(max = 80) String university,
            @Size(max = 500) @Pattern(regexp = "^$|^https?://.*", message = "Debe ser una URL válida") String photoUrl,
            @NotEmpty(message = "Selecciona al menos un tipo de mascota") Set<PetType> petTypes,
            @NotNull Map<DayOfWeek, List<@Pattern(regexp = "^([01]\\d|2[0-3]):[0-5]\\d$",
                    message = "Usa el formato HH:mm") String>> weeklySchedule,
            boolean active) {
    }
}
