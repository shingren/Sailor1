package com.sailor.controller;

import com.sailor.entity.Location;
import com.sailor.repository.LocationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/locations")
public class LocationController {

    @Autowired
    private LocationRepository locationRepository;

    @GetMapping
    public List<Location> getAllLocations() {
        return locationRepository.findAll();
    }

    @PostMapping
    public ResponseEntity<Location> createLocation(@RequestBody Location location) {
        // Check if location with this name already exists
        if (locationRepository.findByName(location.getName()).isPresent()) {
            return ResponseEntity.badRequest().build();
        }
        Location saved = locationRepository.save(location);
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteLocation(@PathVariable Long id) {
        if (!locationRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        locationRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}
