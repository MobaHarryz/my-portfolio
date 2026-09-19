package co.clinicmascotas.api.vet;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.EnumMap;
import java.util.EnumSet;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import co.clinicmascotas.api.clinic.PetType;
import co.clinicmascotas.api.common.ApiException;
import co.clinicmascotas.api.vet.VeterinarianDtos.VetDetail;
import co.clinicmascotas.api.vet.VeterinarianDtos.VetRequest;

@Service
public class VeterinarianService {

    private final VeterinarianRepository repository;

    public VeterinarianService(VeterinarianRepository repository) {
        this.repository = repository;
    }

    public List<Veterinarian> listActive(PetType petType) {
        return petType == null ? repository.findActive() : repository.findActiveByPetType(petType);
    }

    public Veterinarian getActive(String id) {
        return repository.findById(id)
                .filter(Veterinarian::isActive)
                .orElseThrow(() -> ApiException.notFound("El profesional no está disponible."));
    }

    public List<VetDetail> listAll() {
        return repository.findAllByOrderByFullNameAsc().stream().map(VetDetail::from).toList();
    }

    public VetDetail get(String id) {
        return VetDetail.from(find(id));
    }

    public VetDetail create(VetRequest request) {
        Veterinarian vet = new Veterinarian();
        apply(vet, request);
        return VetDetail.from(repository.save(vet));
    }

    public VetDetail update(String id, VetRequest request) {
        Veterinarian vet = find(id);
        apply(vet, request);
        return VetDetail.from(repository.save(vet));
    }

    public void delete(String id) {
        // Soft delete keeps the history of past appointments consistent
        Veterinarian vet = find(id);
        vet.setActive(false);
        repository.save(vet);
    }

    private Veterinarian find(String id) {
        return repository.findById(id).orElseThrow(() -> ApiException.notFound("El profesional no existe."));
    }

    private void apply(Veterinarian vet, VetRequest request) {
        vet.setFullName(request.fullName().trim());
        vet.setTitle(request.title().trim());
        vet.setUniversity(request.university().trim());
        vet.setPhotoUrl(StringUtils.hasText(request.photoUrl()) ? request.photoUrl().trim() : null);
        vet.setPetTypes(EnumSet.copyOf(request.petTypes()));
        vet.setActive(request.active());

        Map<DayOfWeek, List<String>> schedule = new EnumMap<>(DayOfWeek.class);
        request.weeklySchedule().forEach((day, times) -> {
            List<String> normalized = times.stream().map(LocalTime::parse).sorted().distinct()
                    .map(LocalTime::toString).toList();
            if (!normalized.isEmpty()) {
                schedule.put(day, normalized);
            }
        });
        vet.setWeeklySchedule(schedule);
    }
}
