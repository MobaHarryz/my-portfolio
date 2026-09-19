package co.clinicmascotas.api.vet;

import java.time.LocalDate;
import java.util.List;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import co.clinicmascotas.api.appointment.AppointmentService;
import co.clinicmascotas.api.appointment.AvailabilityCalculator.DaySlots;
import co.clinicmascotas.api.clinic.PetType;
import co.clinicmascotas.api.vet.VeterinarianDtos.VetSummary;

@RestController
@RequestMapping("/api/vets")
public class VeterinarianController {

    private final VeterinarianService vets;
    private final AppointmentService appointments;

    public VeterinarianController(VeterinarianService vets, AppointmentService appointments) {
        this.vets = vets;
        this.appointments = appointments;
    }

    @GetMapping
    public List<VetSummary> list(@RequestParam(required = false) PetType petType) {
        return vets.listActive(petType).stream()
                .map(vet -> VetSummary.from(vet, appointments.nextAvailableDate(vet).orElse(null)))
                .toList();
    }

    @GetMapping("/{id}/availability")
    public List<DaySlots> availability(@PathVariable String id,
                                       @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
                                       @RequestParam(defaultValue = "14") int days) {
        return appointments.availability(id, from, days);
    }
}
