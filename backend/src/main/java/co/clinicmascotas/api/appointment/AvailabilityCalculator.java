package co.clinicmascotas.api.appointment;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;

/** Pure scheduling logic, kept free of Spring and MongoDB so it is easy to unit test. */
public final class AvailabilityCalculator {

    public record DaySlots(LocalDate date, List<String> times) {
    }

    private AvailabilityCalculator() {
    }

    /**
     * Returns, for each day in [from, from + days), the schedule times that are neither in the past nor taken.
     * Days without any free time are left out.
     */
    public static List<DaySlots> freeSlots(Map<DayOfWeek, List<String>> weeklySchedule, LocalDate from, int days,
                                           LocalDateTime now, Set<LocalDateTime> taken) {
        List<DaySlots> result = new ArrayList<>();

        for (int i = 0; i < days; i++) {
            LocalDate date = from.plusDays(i);
            List<String> times = weeklySchedule.getOrDefault(date.getDayOfWeek(), List.of()).stream()
                    .map(LocalTime::parse)
                    .sorted()
                    .distinct()
                    .filter(time -> date.atTime(time).isAfter(now))
                    .filter(time -> !taken.contains(date.atTime(time)))
                    .map(LocalTime::toString)
                    .toList();

            if (!times.isEmpty()) {
                result.add(new DaySlots(date, times));
            }
        }
        return result;
    }

    /** True when the vet's weekly schedule offers that exact start time on that weekday. */
    public static boolean isScheduled(Map<DayOfWeek, List<String>> weeklySchedule, LocalDateTime dateTime) {
        return weeklySchedule.getOrDefault(dateTime.getDayOfWeek(), List.of()).stream()
                .map(LocalTime::parse)
                .anyMatch(time -> time.equals(dateTime.toLocalTime()));
    }
}
