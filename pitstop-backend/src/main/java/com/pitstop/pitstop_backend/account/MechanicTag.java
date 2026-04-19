package com.pitstop.pitstop_backend.account;

import jakarta.persistence.*;

@Entity
@Table(name = "mechanic_tags")
public class MechanicTag {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Which mechanic these tags belong to
    @Column(nullable = false)
    private Long mechanicId;

    // Tag text — "Arrived fast", "Fixed it right", "Professional" etc.
    @Column(nullable = false)
    private String tag;

    // How many times this tag has been given to this mechanic
    @Column(nullable = false)
    private Integer count = 0;

    public Long getId() { return id; }

    public Long getMechanicId() { return mechanicId; }
    public void setMechanicId(Long mechanicId) { this.mechanicId = mechanicId; }

    public String getTag() { return tag; }
    public void setTag(String tag) { this.tag = tag; }

    public Integer getCount() { return count; }
    public void setCount(Integer count) { this.count = count; }
}