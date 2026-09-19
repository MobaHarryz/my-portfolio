package co.clinicmascotas.api.vet;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import co.clinicmascotas.api.vet.VeterinarianDtos.VetDetail;
import co.clinicmascotas.api.vet.VeterinarianDtos.VetRequest;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/admin/vets")
public class AdminVeterinarianController {

    private final VeterinarianService vets;

    public AdminVeterinarianController(VeterinarianService vets) {
        this.vets = vets;
    }

    @GetMapping
    public List<VetDetail> list() {
        return vets.listAll();
    }

    @GetMapping("/{id}")
    public VetDetail get(@PathVariable String id) {
        return vets.get(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public VetDetail create(@Valid @RequestBody VetRequest request) {
        return vets.create(request);
    }

    @PutMapping("/{id}")
    public VetDetail update(@PathVariable String id, @Valid @RequestBody VetRequest request) {
        return vets.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deactivate(@PathVariable String id) {
        vets.delete(id);
    }
}
