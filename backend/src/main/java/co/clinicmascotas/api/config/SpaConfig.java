package co.clinicmascotas.api.config;

import java.io.IOException;

import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.resource.PathResourceResolver;

/**
 * Serves the built Angular app (copied into classpath:/static at build time) from the same origin as the API.
 * Unknown paths such as /reservar or /admin/panel fall back to index.html so Angular's router can handle them.
 * When no front-end build is present (local API-only development) this does nothing.
 */
@Configuration
public class SpaConfig implements WebMvcConfigurer {

    private static final Resource INDEX = new ClassPathResource("static/index.html");

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/**")
                .addResourceLocations("classpath:/static/")
                .resourceChain(true)
                .addResolver(new PathResourceResolver() {
                    @Override
                    protected Resource getResource(String path, Resource location) throws IOException {
                        Resource requested = location.createRelative(path);
                        if (requested.exists() && requested.isReadable()) {
                            return requested;
                        }
                        boolean backendPath = path.startsWith("api/") || path.startsWith("actuator/");
                        return backendPath || !INDEX.exists() ? null : INDEX;
                    }
                });
    }
}
