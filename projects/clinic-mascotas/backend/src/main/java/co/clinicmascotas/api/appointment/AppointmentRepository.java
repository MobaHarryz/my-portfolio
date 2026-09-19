package co.clinicmascotas.api.appointment;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

public interface AppointmentRepository extends MongoRepository<Appointment, String> {

    Optional<Appointment> findByCode(String code);

    boolean existsByCode(String code);

    /** Appointments that still hold their slot (anything not cancelled) for a vet in a time window. */
    @Query("{ 'vetId': ?0, 'slotKey': { $exists: true }, 'startsAt': { $gte: ?1, $lt: ?2 } }")
    List<Appointment> findTakenSlots(String vetId, Instant from, Instant to);

    long countByStatusAndStartsAtBetween(Appointment.Status status, Instant from, Instant to);

    long countByStatus(Appointment.Status status);

    long countByStatusAndStartsAtAfter(Appointment.Status status, Instant from);
}
