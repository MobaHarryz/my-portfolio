package co.clinicmascotas.api.clinic;

import java.util.List;

public enum PetType {
    DOG("Perro", List.of("Mestizo", "Labrador", "Golden Retriever", "Bulldog Francés", "Pastor Alemán",
            "Poodle", "Chihuahua", "Schnauzer", "Doberman", "Shih Tzu", "Otra")),
    CAT("Gato", List.of("Mestizo", "Persa", "Siamés", "Maine Coon", "Bengalí", "Angora", "Otra")),
    BIRD("Ave", List.of("Periquito", "Canario", "Loro", "Cacatúa", "Agapornis", "Otra")),
    RODENT("Roedor", List.of("Hámster", "Cobayo", "Chinchilla", "Rata", "Jerbo", "Otra"));

    private final String label;
    private final List<String> breeds;

    PetType(String label, List<String> breeds) {
        this.label = label;
        this.breeds = breeds;
    }

    public String getLabel() {
        return label;
    }

    public List<String> getBreeds() {
        return breeds;
    }
}
