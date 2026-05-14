package com.pitstop.pitstop_backend.config;

import org.springframework.http.*;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Component
public class GeocodingService {

    private final RestTemplate restTemplate;

    public GeocodingService() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(500);
        factory.setReadTimeout(500);
        this.restTemplate = new RestTemplate(factory);
    }

    public String reverseGeocode(double lat, double lng) {
        try {
            String url = "https://nominatim.openstreetmap.org/reverse?lat=" + lat + "&lon=" + lng + "&format=json";
            HttpHeaders headers = new HttpHeaders();
            headers.set("User-Agent", "PitStop/1.0");
            HttpEntity<Void> entity = new HttpEntity<>(headers);
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.GET, entity, Map.class);
            if (response.getBody() == null) return null;
            @SuppressWarnings("unchecked")
            Map<String, String> address = (Map<String, String>) response.getBody().get("address");
            if (address == null) return null;
            if (address.get("suburb") != null) return address.get("suburb");
            if (address.get("city_district") != null) return address.get("city_district");
            return address.get("county");
        } catch (Exception e) {
            return null;
        }
    }
}
