package co.clinicmascotas.api.appointment;

import java.time.Instant;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import co.clinicmascotas.api.clinic.PetType;

@Document("appointments")
public class Appointment {

    public enum Status { CONFIRMED, COMPLETED, NO_SHOW, CANCELLED }

    public enum Sex { MALE, FEMALE }

    public record Pet(String name, String breed, Sex sex, String ageRange, boolean vaccinated) {
    }

    public record Owner(String fullName, String email, String phone) {
    }

    @Id
    private String id;
    /** Short public reference shown to the client, e.g. "CM-7K2QXD". */
    @Indexed(unique = true)
    private String code;
    private PetType petType;
    @Indexed
    private String vetId;
    private String vetName;
    @Indexed
    private Instant startsAt;
    /**
     * "vetId|startsAt" while the slot is taken; removed when cancelled.
     * The unique sparse index makes double booking impossible, even with concurrent requests.
     */
    @Indexed(unique = true, sparse = true)
    private String slotKey;
    private Pet pet;
    private Owner owner;
    private long price;
    private Status status = Status.CONFIRMED;
    private String internalNotes;
    @CreatedDate
    private Instant createdAt;
    @LastModifiedDate
    private Instant updatedAt;

    public static String slotKey(String vetId, Instant startsAt) {
        return vetId + "|" + startsAt;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public PetType getPetType() { return petType; }
    public void setPetType(PetType petType) { this.petType = petType; }
    public String getVetId() { return vetId; }
    public void setVetId(String vetId) { this.vetId = vetId; }
    public String getVetName() { return vetName; }
    public void setVetName(String vetName) { this.vetName = vetName; }
    public Instant getStartsAt() { return startsAt; }
    public void setStartsAt(Instant startsAt) { this.startsAt = startsAt; }
    public String getSlotKey() { return slotKey; }
    public void setSlotKey(String slotKey) { this.slotKey = slotKey; }
    public Pet getPet() { return pet; }
    public void setPet(Pet pet) { this.pet = pet; }
    public Owner getOwner() { return owner; }
    public void setOwner(Owner owner) { this.owner = owner; }
    public long getPrice() { return price; }
    public void setPrice(long price) { this.price = price; }
    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }
    public String getInternalNotes() { return internalNotes; }
    public void setInternalNotes(String internalNotes) { this.internalNotes = internalNotes; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
