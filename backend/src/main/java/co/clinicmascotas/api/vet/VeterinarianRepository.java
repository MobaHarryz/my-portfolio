package co.clinicmascotas.api.vet;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import co.clinicmascotas.api.clinic.PetType;

public interface VeterinarianRepository extends MongoRepository<Veterinarian, String> {

    @Query(value = "{ 'active': true, 'petTypes': ?0 }", sort = "{ 'fullName': 1 }")
    List<Veterinarian> findActiveByPetType(PetType petType);

    @Query(value = "{ 'active': true }", sort = "{ 'fullName': 1 }")
    List<Veterinarian> findActive();

    List<Veterinarian> findAllByOrderByFullNameAsc();
}
