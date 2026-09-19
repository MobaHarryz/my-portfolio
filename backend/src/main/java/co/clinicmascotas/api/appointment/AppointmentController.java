package co.clinicmascotas.api.appointment;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import co.clinicmascotas.api.appointment.AppointmentDtos.AppointmentConfirmation;
import co.clinicmascotas.api.appointment.AppointmentDtos.CreateAppointmentRequest;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/appointments")
public class AppointmentController {

    private final AppointmentService appointments;

    public AppointmentController(AppointmentService appointments) {
        this.appointments = appointments;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AppointmentConfirmation create(@Valid @RequestBody CreateAppointmentRequest request) {
        return appointments.create(request);
    }

    @GetMapping("/{code}")
    public AppointmentConfirmation confirmation(@PathVariable String code) {
        return appointments.findConfirmation(code);
    }
}
