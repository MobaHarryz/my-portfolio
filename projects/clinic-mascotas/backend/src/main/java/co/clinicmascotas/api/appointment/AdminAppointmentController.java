package co.clinicmascotas.api.appointment;

import java.time.LocalDate;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import co.clinicmascotas.api.appointment.Appointment.Status;
import co.clinicmascotas.api.appointment.AppointmentDtos.AppointmentDetail;
import co.clinicmascotas.api.appointment.AppointmentDtos.AppointmentFilter;
import co.clinicmascotas.api.appointment.AppointmentDtos.DashboardStats;
import co.clinicmascotas.api.appointment.AppointmentDtos.UpdateAppointmentRequest;
import co.clinicmascotas.api.contact.ContactService;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/admin")
public class AdminAppointmentController {

    private final AppointmentService appointments;
    private final ContactService contact;

    public AdminAppointmentController(AppointmentService appointments, ContactService contact) {
        this.appointments = appointments;
        this.contact = contact;
    }

    public record PageResponse<T>(java.util.List<T> content, int page, int size, long totalElements, int totalPages) {
        static <T> PageResponse<T> of(Page<T> page) {
            return new PageResponse<>(page.getContent(), page.getNumber(), page.getSize(),
                    page.getTotalElements(), page.getTotalPages());
        }
    }

    @GetMapping("/stats")
    public DashboardStats stats() {
        return appointments.stats(contact.countUnread());
    }

    @GetMapping("/appointments")
    public PageResponse<AppointmentDetail> search(
            @RequestParam(required = false) Status status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) String vetId,
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        PageRequest pageable = PageRequest.of(Math.max(page, 0), Math.clamp(size, 1, 100));
        return PageResponse.of(appointments.search(new AppointmentFilter(status, date, vetId, q), pageable));
    }

    @PatchMapping("/appointments/{id}")
    public AppointmentDetail update(@PathVariable String id, @Valid @RequestBody UpdateAppointmentRequest request) {
        return appointments.update(id, request);
    }
}
