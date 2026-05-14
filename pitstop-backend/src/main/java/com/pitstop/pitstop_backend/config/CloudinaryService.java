package com.pitstop.pitstop_backend.config;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@Service
public class CloudinaryService {

    private final Cloudinary cloudinary;

    public CloudinaryService(Cloudinary cloudinary) {
        this.cloudinary = cloudinary;
    }

    public String upload(MultipartFile file) throws IOException {
        return upload(file, "pitstop/jobs");
    }

    public String upload(MultipartFile file, String folder) throws IOException {
        String contentType = file.getContentType();
        if (contentType == null || !List.of("image/jpeg", "image/png", "image/webp").contains(contentType)) {
            throw new IOException("Only JPEG, PNG and WebP images are allowed");
        }
        if (file.getSize() > 5L * 1024 * 1024) {
            throw new IOException("File size must be under 5MB");
        }

        Map<?, ?> result = cloudinary.uploader().upload(
                file.getBytes(),
                ObjectUtils.asMap("folder", folder)
        );
        return (String) result.get("secure_url");
    }
}