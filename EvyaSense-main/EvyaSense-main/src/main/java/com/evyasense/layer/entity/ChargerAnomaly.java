package com.evyasense.layer.entity;

import com.evyasense.layer.canonical.AnomalyType;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
public class ChargerAnomaly {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	private String chargerId;

	@Enumerated(EnumType.STRING)
	private AnomalyType anomalyType;

	private LocalDateTime detectedAt;

	private String status;
	private String severity;
	private Integer occurrenceCount;
	@Column(length = 10000)
	private String rootCause;
	private String Effect;

	public String getRootCause() {
		return rootCause;
	}

	public void setRootCause(String rootCause) {
		this.rootCause = rootCause;
	}

	public String getEffect() {
		return Effect;
	}

	public void setEffect(String effect) {
		Effect = effect;
	}

	public String getSeverity() {
		return severity;
	}

	public void setSeverity(String severity) {
		this.severity = severity;
	}

	public Integer getOccurrenceCount() {
		return occurrenceCount;
	}

	public void setOccurrenceCount(Integer occurrenceCount) {
		this.occurrenceCount = occurrenceCount;
	}

	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public String getChargerId() {
		return chargerId;
	}

	public void setChargerId(String chargerId) {
		this.chargerId = chargerId;
	}

	public AnomalyType getAnomalyType() {
		return anomalyType;
	}

	public void setAnomalyType(AnomalyType anomalyType) {
		this.anomalyType = anomalyType;
	}

	public LocalDateTime getDetectedAt() {
		return detectedAt;
	}

	public void setDetectedAt(LocalDateTime detectedAt) {
		this.detectedAt = detectedAt;
	}

	public String getStatus() {
		return status;
	}

	public void setStatus(String status) {
		this.status = status;
	}

}
