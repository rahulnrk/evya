package com.evyasense.layer.model;

import lombok.Data;


import lombok.Data;

@Data
public class RemoteStartTransactionPayload {

    private Integer connectorId;
    private String idTag;
    private ChargingProfile chargingProfile;

    public Integer getConnectorId() {
		return connectorId;
	}

	public void setConnectorId(Integer connectorId) {
		this.connectorId = connectorId;
	}

	public String getIdTag() {
		return idTag;
	}

	public void setIdTag(String idTag) {
		this.idTag = idTag;
	}

	public ChargingProfile getChargingProfile() {
		return chargingProfile;
	}

	public void setChargingProfile(ChargingProfile chargingProfile) {
		this.chargingProfile = chargingProfile;
	}

	@Data
    public static class ChargingProfile {

        private Integer chargingProfileId;
        private Integer stackLevel;
        private String chargingProfilePurpose;
        private String chargingProfileKind;
        private Integer recurrencyKind;
        private ChargingSchedule chargingSchedule;
		public Integer getChargingProfileId() {
			return chargingProfileId;
		}
		public void setChargingProfileId(Integer chargingProfileId) {
			this.chargingProfileId = chargingProfileId;
		}
		public Integer getStackLevel() {
			return stackLevel;
		}
		public void setStackLevel(Integer stackLevel) {
			this.stackLevel = stackLevel;
		}
		public String getChargingProfilePurpose() {
			return chargingProfilePurpose;
		}
		public void setChargingProfilePurpose(String chargingProfilePurpose) {
			this.chargingProfilePurpose = chargingProfilePurpose;
		}
		public String getChargingProfileKind() {
			return chargingProfileKind;
		}
		public void setChargingProfileKind(String chargingProfileKind) {
			this.chargingProfileKind = chargingProfileKind;
		}
		public Integer getRecurrencyKind() {
			return recurrencyKind;
		}
		public void setRecurrencyKind(Integer recurrencyKind) {
			this.recurrencyKind = recurrencyKind;
		}
		public ChargingSchedule getChargingSchedule() {
			return chargingSchedule;
		}
		public void setChargingSchedule(ChargingSchedule chargingSchedule) {
			this.chargingSchedule = chargingSchedule;
		}
    }

    @Data
    public static class ChargingSchedule {

        private Integer duration;
        private Integer startSchedule;
        private String chargingRateUnit;
		public Integer getDuration() {
			return duration;
		}
		public void setDuration(Integer duration) {
			this.duration = duration;
		}
		public Integer getStartSchedule() {
			return startSchedule;
		}
		public void setStartSchedule(Integer startSchedule) {
			this.startSchedule = startSchedule;
		}
		public String getChargingRateUnit() {
			return chargingRateUnit;
		}
		public void setChargingRateUnit(String chargingRateUnit) {
			this.chargingRateUnit = chargingRateUnit;
		}
    }
}
