package co.clinicmascotas.api.appointment;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;

import co.clinicmascotas.api.appointment.Appointment.Sex;
import co.clinicmascotas.api.appointment.Appointment.Status;
import co.clinicmascotas.api.clinic.PetType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public final class AppointmentDtos {

    private AppointmentDtos() {
    }

    public record PetRequest(
            @NotBlank(message = "Ingresa el nombre de tu mascota") @Size(max = 40) String name,
            @NotBlank(message = "Selecciona la raza") @Size(max = 40) String breed,
            @NotNull(message = "Selecciona el sexo") Sex sex,
            @NotBlank(message = "Selecciona la edad") @Size(max = 30) String ageRange,
            @NotNull(message = "Indica si tiene sus vacunas al día") Boolean vaccinated) {
    }

    public record OwnerRequest(
            @NotBlank(message = "Ingresa tu nombre completo") @Size(max = 80) String fullName,
            @NotBlank(message = "Ingresa tu email") @Email(message = "Ingresa un email válido") @Size(max = 120) String email,
            @NotBlank(message = "Ingresa tu teléfono")
            @Pattern(regexp = "^\\+?[0-9 ()-]{7,20}$", message = "Ingresa un teléfono válido") String phone) {
    }

    public record CreateAppointmentRequest(
            @NotNull(message = "Selecciona el tipo de mascota") PetType petType,
            @NotBlank(message = "Selecciona un médico veterinario") String vetId,
            /** Local clinic date and time, e.g. 2026-09-16T13:00 */
            @NotNull(message = "Selecciona fecha y hora") LocalDateTime startsAt,
            @NotNull @Valid PetRequest pet,
            @NotNull @Valid OwnerRequest owner) {
    }

    /** Minimal data for the public confirmation page: no email or phone. */
    public record AppointmentConfirmation(String code, String petName, PetType petType, String vetName,
                                          LocalDateTime startsAt, long price, Status status) {
    }

    public record AppointmentDetail(String id, String code, PetType petType, String vetId, String vetName,
                                    LocalDateTime startsAt, Appointment.Pet pet, Appointment.Owner owner,
                                    long price, Status status, String internalNotes, Instant createdAt) {
    }

    public record UpdateAppointmentRequest(Status status, @Size(max = 1000) String internalNotes) {
    }

    public record AppointmentFilter(Status status, LocalDate date, String vetId, String q) {
    }

    public record DashboardStats(long today, long upcoming, long completed, long cancelled, long unreadMessages) {
    }
}
