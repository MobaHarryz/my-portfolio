package co.clinicmascotas.api.contact;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import co.clinicmascotas.api.contact.ContactService.ContactRequest;
import co.clinicmascotas.api.contact.ContactService.ContactResponse;
import jakarta.validation.Valid;

@RestController
public class ContactController {

    public record ReadRequest(boolean read) {
    }

    private final ContactService contact;

    public ContactController(ContactService contact) {
        this.contact = contact;
    }

    @PostMapping("/api/contact")
    @ResponseStatus(HttpStatus.CREATED)
    public void send(@Valid @RequestBody ContactRequest request) {
        contact.create(request);
    }

    @GetMapping("/api/admin/messages")
    public List<ContactResponse> list() {
        return contact.list();
    }

    @PatchMapping("/api/admin/messages/{id}")
    public ContactResponse markRead(@PathVariable String id, @RequestBody ReadRequest request) {
        return contact.markRead(id, request.read());
    }
}
