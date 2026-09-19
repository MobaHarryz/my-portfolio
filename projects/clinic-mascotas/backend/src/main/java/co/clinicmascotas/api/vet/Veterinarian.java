package co.clinicmascotas.api.vet;

import java.time.DayOfWeek;
import java.time.Instant;
import java.util.EnumMap;
import java.util.EnumSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import co.clinicmascotas.api.clinic.PetType;

@Document("veterinarians")
public class Veterinarian {

    @Id
    private String id;
    private String fullName;
    private String title;
    private String university;
    private String photoUrl;
    private Set<PetType> petTypes = EnumSet.noneOf(PetType.class);
    /**
     * Weekly agenda: consultation start times ("HH:mm", clinic time zone) offered each day.
     * Stored as strings so they never shift with the server's time zone.
     */
    private Map<DayOfWeek, List<String>> weeklySchedule = new EnumMap<>(DayOfWeek.class);
    private boolean active = true;
    @CreatedDate
    private Instant createdAt;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getUniversity() { return university; }
    public void setUniversity(String university) { this.university = university; }
    public String getPhotoUrl() { return photoUrl; }
    public void setPhotoUrl(String photoUrl) { this.photoUrl = photoUrl; }
    public Set<PetType> getPetTypes() { return petTypes; }
    public void setPetTypes(Set<PetType> petTypes) { this.petTypes = petTypes; }
    public Map<DayOfWeek, List<String>> getWeeklySchedule() { return weeklySchedule; }
    public void setWeeklySchedule(Map<DayOfWeek, List<String>> weeklySchedule) { this.weeklySchedule = weeklySchedule; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
