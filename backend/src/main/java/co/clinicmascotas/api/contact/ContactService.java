package co.clinicmascotas.api.contact;

import java.time.Instant;
import java.util.List;

import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import co.clinicmascotas.api.common.ApiException;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Service
public class ContactService {

    public record ContactRequest(
            @NotBlank(message = "Ingresa tus nombres") @Size(max = 60) String firstName,
            @NotBlank(message = "Ingresa tus apellidos") @Size(max = 60) String lastName,
            @NotBlank(message = "Ingresa tu correo") @Email(message = "Ingresa un correo válido") @Size(max = 120) String email,
            @NotBlank(message = "Escribe tus observaciones") @Size(max = 2000) String message) {
    }

    public record ContactResponse(String id, String firstName, String lastName, String email, String message,
                                  boolean read, Instant createdAt) {

        static ContactResponse from(ContactMessage m) {
            return new ContactResponse(m.getId(), m.getFirstName(), m.getLastName(), m.getEmail(), m.getMessage(),
                    m.isRead(), m.getCreatedAt());
        }
    }

    private final ContactMessageRepository repository;

    public ContactService(ContactMessageRepository repository) {
        this.repository = repository;
    }

    public void create(ContactRequest request) {
        ContactMessage message = new ContactMessage();
        message.setFirstName(request.firstName().trim());
        message.setLastName(request.lastName().trim());
        message.setEmail(request.email().trim().toLowerCase());
        message.setMessage(request.message().trim());
        repository.save(message);
    }

    public List<ContactResponse> list() {
        return repository.findAll(Sort.by(Sort.Direction.DESC, "createdAt")).stream()
                .map(ContactResponse::from).toList();
    }

    public ContactResponse markRead(String id, boolean read) {
        ContactMessage message = repository.findById(id)
                .orElseThrow(() -> ApiException.notFound("El mensaje no existe."));
        message.setRead(read);
        return ContactResponse.from(repository.save(message));
    }

    public long countUnread() {
        return repository.countByReadFalse();
    }
}
