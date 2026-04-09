package com.pitstop.pitstop_backend.mechanic;

import jakarta.persistence.*;
import java.util.List;

@Entity
@Table(name = "mechanics")
public class Mechanic {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String email;
    private String passwordHash;
    private String mobileNumber;

    @ElementCollection
    private List<String> skills;

    @ElementCollection
    private List<String> vehicleTypes;

    private boolean isAvailable;
    private boolean isVerified;
    private double latitude;
    private double longitude;

    // constructors, getters, setters, toString
    // (keep same pattern as your current class)

    public Mechanic() {
    }

    public Mechanic(String name, String email, String passwordHash, String mobileNumber, List<String> skills, List<String> vehicleTypes, boolean isAvailable, boolean isVerified, double latitude, double longitude) {
        this.name = name;
        this.email = email;
        this.passwordHash = passwordHash;
        this.mobileNumber = mobileNumber;
        this.skills = skills;
        this.vehicleTypes = vehicleTypes;
        this.isAvailable = isAvailable;
        this.isVerified = isVerified;
        this.latitude = latitude;
        this.longitude = longitude;
    }

    public Mechanic(Long id, String name, String email, String passwordHash, String mobileNumber, List<String> skills, List<String> vehicleTypes, boolean isAvailable, boolean isVerified, double latitude, double longitude) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.passwordHash = passwordHash;
        this.mobileNumber = mobileNumber;
        this.skills = skills;
        this.vehicleTypes = vehicleTypes;
        this.isAvailable = isAvailable;
        this.isVerified = isVerified;
        this.latitude = latitude;
        this.longitude = longitude;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    public String getMobileNumber() {
        return mobileNumber;
    }

    public void setMobileNumber(String mobileNumber) {
        this.mobileNumber = mobileNumber;
    }

    public List<String> getSkills() {
        return skills;
    }

    public void setSkills(List<String> skills) {
        this.skills = skills;
    }

    public List<String> getVehicleTypes() {
        return vehicleTypes;
    }

    public void setVehicleTypes(List<String> vehicleTypes) {
        this.vehicleTypes = vehicleTypes;
    }

    public boolean isAvailable() {
        return isAvailable;
    }

    public void setAvailable(boolean available) {
        isAvailable = available;
    }

    public boolean isVerified() {
        return isVerified;
    }

    public void setVerified(boolean verified) {
        isVerified = verified;
    }

    public double getLatitude() {
        return latitude;
    }

    public void setLatitude(double latitude) {
        this.latitude = latitude;
    }

    public double getLongitude() {
        return longitude;
    }

    public void setLongitude(double longitude) {
        this.longitude = longitude;
    }

    @Override
    public String toString() {
        return "Mechanic{" +
                "id=" + id +
                ", name='" + name + '\'' +
                ", email='" + email + '\'' +
                ", password='" + passwordHash + '\'' +
                ", mobileNumber='" + mobileNumber + '\'' +
                ", skills=" + skills +
                ", vehicleTypes=" + vehicleTypes +
                ", isAvailable=" + isAvailable +
                ", isVerified=" + isVerified +
                ", latitude=" + latitude +
                ", longitude=" + longitude +
                '}';
    }
}