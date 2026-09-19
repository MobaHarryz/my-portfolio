package co.clinicmascotas.api.config;

import java.time.DayOfWeek;
import java.util.EnumMap;
import java.util.EnumSet;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import co.clinicmascotas.api.auth.AdminUser;
import co.clinicmascotas.api.auth.AdminUserRepository;
import co.clinicmascotas.api.clinic.PetType;
import co.clinicmascotas.api.vet.Veterinarian;
import co.clinicmascotas.api.vet.VeterinarianRepository;

/** Creates the first admin account and, optionally, the demo veterinarians shown in the designs. */
@Component
public class DataSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    private final AdminUserRepository admins;
    private final VeterinarianRepository vets;
    private final PasswordEncoder passwordEncoder;
    private final AppProperties properties;

    public DataSeeder(AdminUserRepository admins, VeterinarianRepository vets, PasswordEncoder passwordEncoder,
                      AppProperties properties) {
        this.admins = admins;
        this.vets = vets;
        this.passwordEncoder = passwordEncoder;
        this.properties = properties;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (admins.count() == 0) {
            AdminUser admin = new AdminUser();
            admin.setEmail(properties.admin().email().toLowerCase());
            admin.setName(properties.admin().name());
            admin.setPasswordHash(passwordEncoder.encode(properties.admin().password()));
            admins.save(admin);
            log.info("Created initial admin account {}", admin.getEmail());
        }

        if (properties.seed().demoData() && vets.count() == 0) {
            List<String> morning = List.of("09:00", "10:00", "11:00");
            List<String> afternoon = List.of("13:00", "14:00", "15:00", "16:00");
            List<String> fullDay = List.of("10:00", "11:00", "13:00", "15:00", "16:00");

            vets.saveAll(List.of(
                    vet("Dr. Mario Bongá", "Médico veterinario", "U. de Antioquia",
                            EnumSet.of(PetType.DOG, PetType.CAT),
                            schedule(fullDay, DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.THURSDAY)),
                    vet("Dr. Lorenzo Torres", "Médico veterinario", "Tecnológico de Antioquia",
                            EnumSet.of(PetType.DOG, PetType.CAT, PetType.RODENT),
                            schedule(afternoon, DayOfWeek.MONDAY, DayOfWeek.WEDNESDAY, DayOfWeek.FRIDAY)),
                    vet("Dra. Lía Touré", "Médica veterinaria", "I.U. Pascual Bravo",
                            EnumSet.of(PetType.CAT, PetType.BIRD),
                            schedule(morning, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY, DayOfWeek.SATURDAY)),
                    vet("Dr. Andrux Potz", "Médico veterinario", "I.T.M",
                            EnumSet.of(PetType.DOG, PetType.BIRD, PetType.RODENT),
                            schedule(fullDay, DayOfWeek.WEDNESDAY, DayOfWeek.THURSDAY, DayOfWeek.FRIDAY)),
                    vet("Dra. Sara Montoya", "Médica veterinaria · Exóticos", "U. CES",
                            EnumSet.of(PetType.BIRD, PetType.RODENT),
                            schedule(afternoon, DayOfWeek.MONDAY, DayOfWeek.THURSDAY, DayOfWeek.SATURDAY)),
                    vet("Dr. Tomás Quintero", "Médico veterinario · Urgencias", "U. de Antioquia",
                            EnumSet.allOf(PetType.class),
                            schedule(morning, DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY,
                                    DayOfWeek.THURSDAY, DayOfWeek.FRIDAY))));
            log.info("Loaded demo veterinarians");
        }
    }

    private static Veterinarian vet(String name, String title, String university, EnumSet<PetType> petTypes,
                                    Map<DayOfWeek, List<String>> schedule) {
        Veterinarian vet = new Veterinarian();
        vet.setFullName(name);
        vet.setTitle(title);
        vet.setUniversity(university);
        vet.setPetTypes(petTypes);
        vet.setWeeklySchedule(schedule);
        return vet;
    }

    private static Map<DayOfWeek, List<String>> schedule(List<String> times, DayOfWeek... days) {
        Map<DayOfWeek, List<String>> schedule = new EnumMap<>(DayOfWeek.class);
        for (DayOfWeek day : days) {
            schedule.put(day, times);
        }
        return schedule;
    }
}
