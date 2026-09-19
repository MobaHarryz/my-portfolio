package co.clinicmascotas.api.appointment;

import java.security.SecureRandom;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import co.clinicmascotas.api.appointment.Appointment.Status;
import co.clinicmascotas.api.appointment.AppointmentDtos.AppointmentConfirmation;
import co.clinicmascotas.api.appointment.AppointmentDtos.AppointmentDetail;
import co.clinicmascotas.api.appointment.AppointmentDtos.AppointmentFilter;
import co.clinicmascotas.api.appointment.AppointmentDtos.CreateAppointmentRequest;
import co.clinicmascotas.api.appointment.AppointmentDtos.UpdateAppointmentRequest;
import co.clinicmascotas.api.appointment.AvailabilityCalculator.DaySlots;
import co.clinicmascotas.api.common.ApiException;
import co.clinicmascotas.api.config.AppProperties;
import co.clinicmascotas.api.vet.Veterinarian;
import co.clinicmascotas.api.vet.VeterinarianService;

@Service
public class AppointmentService {

    private static final String CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final SecureRandom RANDOM = new SecureRandom();

    private final AppointmentRepository appointments;
    private final VeterinarianService vets;
    private final MongoTemplate mongo;
    private final AppProperties.Clinic clinic;
    private final ZoneId zone;
    private final Clock clock;

    public AppointmentService(AppointmentRepository appointments, VeterinarianService vets, MongoTemplate mongo,
                              AppProperties properties, Clock clock) {
        this.appointments = appointments;
        this.vets = vets;
        this.mongo = mongo;
        this.clinic = properties.clinic();
        this.zone = ZoneId.of(clinic.timeZone());
        this.clock = clock;
    }

    // ---------- Public ----------

    public List<DaySlots> availability(String vetId, LocalDate from, int days) {
        return availability(vets.getActive(vetId), from, days);
    }

    /** First day with at least one free slot within the booking window, or empty when the vet is fully booked. */
    public Optional<LocalDate> nextAvailableDate(Veterinarian vet) {
        return availability(vet, null, clinic.bookingDaysAhead() + 1).stream().findFirst().map(DaySlots::date);
    }

    private List<DaySlots> availability(Veterinarian vet, LocalDate from, int days) {
        String vetId = vet.getId();
        LocalDate today = LocalDate.now(clock.withZone(zone));
        LocalDate start = (from == null || from.isBefore(today)) ? today : from;
        LocalDate lastBookable = today.plusDays(clinic.bookingDaysAhead());
        int span = (int) Math.max(0, Math.min(Math.clamp(days, 1, 60), ChronoUnit.DAYS.between(start, lastBookable) + 1));

        Set<LocalDateTime> taken = appointments
                .findTakenSlots(vetId, toInstant(start.atStartOfDay()), toInstant(start.plusDays(span).atStartOfDay()))
                .stream()
                .map(appointment -> toLocal(appointment.getStartsAt()))
                .collect(Collectors.toSet());

        return AvailabilityCalculator.freeSlots(vet.getWeeklySchedule(), start, span, LocalDateTime.now(clock.withZone(zone)), taken);
    }

    public AppointmentConfirmation create(CreateAppointmentRequest request) {
        Veterinarian vet = vets.getActive(request.vetId());
        LocalDateTime startsAt = request.startsAt().withSecond(0).withNano(0);
        LocalDateTime now = LocalDateTime.now(clock.withZone(zone));

        if (!vet.getPetTypes().contains(request.petType())) {
            throw ApiException.badRequest("Este profesional no atiende ese tipo de mascota.");
        }
        if (!request.petType().getBreeds().contains(request.pet().breed())) {
            throw ApiException.badRequest("Selecciona una raza de la lista.");
        }
        if (!startsAt.isAfter(now) || startsAt.toLocalDate().isAfter(now.toLocalDate().plusDays(clinic.bookingDaysAhead()))) {
            throw ApiException.badRequest("La fecha seleccionada ya no está disponible.");
        }
        if (!AvailabilityCalculator.isScheduled(vet.getWeeklySchedule(), startsAt)) {
            throw ApiException.badRequest("El profesional no atiende en ese horario.");
        }

        Instant instant = toInstant(startsAt);
        Appointment appointment = new Appointment();
        appointment.setCode(newCode());
        appointment.setPetType(request.petType());
        appointment.setVetId(vet.getId());
        appointment.setVetName(vet.getFullName());
        appointment.setStartsAt(instant);
        appointment.setSlotKey(Appointment.slotKey(vet.getId(), instant));
        appointment.setPet(new Appointment.Pet(request.pet().name().trim(), request.pet().breed(),
                request.pet().sex(), request.pet().ageRange(), request.pet().vaccinated()));
        appointment.setOwner(new Appointment.Owner(request.owner().fullName().trim(),
                request.owner().email().trim().toLowerCase(), request.owner().phone().trim()));
        appointment.setPrice(clinic.consultationPrice());

        // A concurrent booking of the same slot fails on the unique index -> 409 (see ApiExceptionHandler)
        return toConfirmation(appointments.insert(appointment));
    }

    public AppointmentConfirmation findConfirmation(String code) {
        return appointments.findByCode(code.toUpperCase())
                .map(this::toConfirmation)
                .orElseThrow(() -> ApiException.notFound("No encontramos esa reserva."));
    }

    // ---------- Admin ----------

    public Page<AppointmentDetail> search(AppointmentFilter filter, Pageable pageable) {
        Query query = new Query();

        if (filter.status() != null) {
            query.addCriteria(Criteria.where("status").is(filter.status()));
        }
        if (StringUtils.hasText(filter.vetId())) {
            query.addCriteria(Criteria.where("vetId").is(filter.vetId()));
        }
        if (filter.date() != null) {
            query.addCriteria(Criteria.where("startsAt")
                    .gte(toInstant(filter.date().atStartOfDay()))
                    .lt(toInstant(filter.date().plusDays(1).atStartOfDay())));
        }
        if (StringUtils.hasText(filter.q())) {
            Pattern text = Pattern.compile(Pattern.quote(filter.q().trim()), Pattern.CASE_INSENSITIVE);
            query.addCriteria(new Criteria().orOperator(
                    Criteria.where("code").regex(text),
                    Criteria.where("pet.name").regex(text),
                    Criteria.where("owner.fullName").regex(text),
                    Criteria.where("owner.email").regex(text)));
        }

        long total = mongo.count(query, Appointment.class);
        query.with(pageable).with(Sort.by(Sort.Direction.ASC, "startsAt"));
        List<AppointmentDetail> content = mongo.find(query, Appointment.class).stream().map(this::toDetail).toList();
        return new PageImpl<>(content, pageable, total);
    }

    public AppointmentDetail update(String id, UpdateAppointmentRequest request) {
        Appointment appointment = appointments.findById(id)
                .orElseThrow(() -> ApiException.notFound("La reserva no existe."));

        if (request.status() != null && request.status() != appointment.getStatus()) {
            if (request.status() == Status.CANCELLED) {
                appointment.setSlotKey(null); // frees the slot for other clients
            } else if (appointment.getStatus() == Status.CANCELLED) {
                appointment.setSlotKey(Appointment.slotKey(appointment.getVetId(), appointment.getStartsAt()));
            }
            appointment.setStatus(request.status());
        }
        if (request.internalNotes() != null) {
            appointment.setInternalNotes(request.internalNotes().trim());
        }
        return toDetail(appointments.save(appointment));
    }

    public AppointmentDtos.DashboardStats stats(long unreadMessages) {
        LocalDate today = LocalDate.now(clock.withZone(zone));
        Instant startOfDay = toInstant(today.atStartOfDay());
        Instant endOfDay = toInstant(today.plusDays(1).atStartOfDay());

        return new AppointmentDtos.DashboardStats(
                appointments.countByStatusAndStartsAtBetween(Status.CONFIRMED, startOfDay, endOfDay),
                appointments.countByStatusAndStartsAtAfter(Status.CONFIRMED, clock.instant()),
                appointments.countByStatus(Status.COMPLETED),
                appointments.countByStatus(Status.CANCELLED),
                unreadMessages);
    }

    // ---------- Helpers ----------

    private String newCode() {
        String code;
        do {
            StringBuilder builder = new StringBuilder("CM-");
            for (int i = 0; i < 6; i++) {
                builder.append(CODE_ALPHABET.charAt(RANDOM.nextInt(CODE_ALPHABET.length())));
            }
            code = builder.toString();
        } while (appointments.existsByCode(code));
        return code;
    }

    private Instant toInstant(LocalDateTime local) {
        return local.atZone(zone).toInstant();
    }

    private LocalDateTime toLocal(Instant instant) {
        return LocalDateTime.ofInstant(instant, zone);
    }

    private AppointmentConfirmation toConfirmation(Appointment a) {
        return new AppointmentConfirmation(a.getCode(), a.getPet().name(), a.getPetType(), a.getVetName(),
                toLocal(a.getStartsAt()), a.getPrice(), a.getStatus());
    }

    private AppointmentDetail toDetail(Appointment a) {
        return new AppointmentDetail(a.getId(), a.getCode(), a.getPetType(), a.getVetId(), a.getVetName(),
                toLocal(a.getStartsAt()), a.getPet(), a.getOwner(), a.getPrice(), a.getStatus(),
                a.getInternalNotes(), a.getCreatedAt());
    }
}
