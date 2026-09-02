package com.ewe.form;



import java.util.ArrayList;
import java.util.List;
import java.util.Set;

public class GetSiteDetailsDto {

    private Long siteId;
    private String siteName;
    private String address;

    private long noOfPorts;
    private long avaiPorts;
    

    private String siteStatus;

    private Set<String> powerTypes;
    private Set<String> connectorTypes;
    private Double distanceKm;
    private Double latitude;
    private Double longitude;

    /**
     * SCALE-3 correlation: station.OCPPId values at this site (EvyaSense Redis charger keys).
     * Alias for clients: same values as chargerRefs.
     */
    private Set<String> chargerRefs;

    /**
     * SCALE-3: port ↔ connector mapping for live status
     * (chargerRef = OCPPId, connectorId = OCPP connector id).
     */
    private List<PortRef> ports = new ArrayList<>();

    public static class PortRef {
        private String chargerRef;
        private String connectorId;
        private Long portId;

        public PortRef() {}

        public PortRef(String chargerRef, String connectorId, Long portId) {
            this.chargerRef = chargerRef;
            this.connectorId = connectorId;
            this.portId = portId;
        }

        public String getChargerRef() { return chargerRef; }
        public void setChargerRef(String chargerRef) { this.chargerRef = chargerRef; }
        public String getConnectorId() { return connectorId; }
        public void setConnectorId(String connectorId) { this.connectorId = connectorId; }
        public Long getPortId() { return portId; }
        public void setPortId(Long portId) { this.portId = portId; }
    }


    public Double getLatitude() {
		return latitude;
	}

	public void setLatitude(Double latitude) {
		this.latitude = latitude;
	}

	public Double getLongitude() {
		return longitude;
	}

	public void setLongitude(Double longitude) {
		this.longitude = longitude;
	}

	public Double getDistanceKm() {
		return distanceKm;
	}

	public void setDistanceKm(Double distanceKm) {
		this.distanceKm = distanceKm;
	}

	// Combined range fields
    private String capacityRange;   // ex: "3.2-3.2"
    private String priceRange;      // ex: "10-20"

   

    // -------- Getters & Setters --------

    public Long getSiteId() {
        return siteId;
    }

    public void setSiteId(Long siteId) {
        this.siteId = siteId;
    }

    public String getSiteName() {
        return siteName;
    }

    public void setSiteName(String siteName) {
        this.siteName = siteName;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public long getNoOfPorts() {
        return noOfPorts;
    }

    public void setNoOfPorts(long noOfPorts) {
        this.noOfPorts = noOfPorts;
    }

    public long getAvaiPorts() {
        return avaiPorts;
    }

    public void setAvaiPorts(long avaiPorts) {
        this.avaiPorts = avaiPorts;
    }

   

    public String getSiteStatus() {
        return siteStatus;
    }

    public void setSiteStatus(String siteStatus) {
        this.siteStatus = siteStatus;
    }

    public Set<String> getPowerTypes() {
        return powerTypes;
    }

    public void setPowerTypes(Set<String> powerTypes) {
        this.powerTypes = powerTypes;
    }

    public Set<String> getConnectorTypes() {
        return connectorTypes;
    }

    public void setConnectorTypes(Set<String> connectorTypes) {
        this.connectorTypes = connectorTypes;
    }

    public String getCapacityRange() {
        return capacityRange;
    }

    public void setCapacityRange(String capacityRange) {
        this.capacityRange = capacityRange;
    }

    public String getPriceRange() {
        return priceRange;
    }

    public void setPriceRange(String priceRange) {
        this.priceRange = priceRange;
    }

    public Set<String> getChargerRefs() {
        return chargerRefs;
    }

    public void setChargerRefs(Set<String> chargerRefs) {
        this.chargerRefs = chargerRefs;
    }

    public List<PortRef> getPorts() {
        return ports;
    }

    public void setPorts(List<PortRef> ports) {
        this.ports = ports != null ? ports : new ArrayList<>();
    }

    }


