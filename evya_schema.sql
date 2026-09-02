-- --------------------------------------------------------
-- Host:                         13.233.199.112
-- Server version:               Microsoft SQL Server 2025 (RTM-CU5-GDR) (KB5095565) - 17.0.4050.1
-- Server OS:                    Linux (Ubuntu 24.04.4 LTS) <X64>
-- HeidiSQL Version:             12.11.0.7065
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES  */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- Dumping database structure for evya
CREATE DATABASE IF NOT EXISTS "evya";
USE "evya";

-- Dumping structure for table evya.accounts
CREATE TABLE IF NOT EXISTS "accounts" (
	"id" NUMERIC(19,0),
	"accountBalance" FLOAT,
	"creationDate" DATETIME DEFAULT NULL,
	"currencySymbol" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"currencyType" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"user_id" NUMERIC(19,0) DEFAULT NULL,
	FOREIGN KEY INDEX "FK9g0vaah5lcwuekm62j7r8t8c3" ("user_id"),
	PRIMARY KEY ("id"),
	CONSTRAINT "FK9g0vaah5lcwuekm62j7r8t8c3" FOREIGN KEY ("user_id") REFERENCES "Users" ("id") ON UPDATE NO_ACTION ON DELETE NO_ACTION
);

-- Data exporting was unselected.

-- Dumping structure for table evya.account_transaction
CREATE TABLE IF NOT EXISTS "account_transaction" (
	"id" NUMERIC(19,0),
	"amtCredit" FLOAT,
	"amtDebit" FLOAT,
	"comment" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"creationDate" DATETIME DEFAULT NULL,
	"currentBalance" FLOAT,
	"status" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"transactionId" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"account_id" NUMERIC(19,0) DEFAULT NULL,
	FOREIGN KEY INDEX "FKe2thu93950v1ptie75f01y1g3" ("account_id"),
	PRIMARY KEY ("id"),
	CONSTRAINT "FKe2thu93950v1ptie75f01y1g3" FOREIGN KEY ("account_id") REFERENCES "accounts" ("id") ON UPDATE NO_ACTION ON DELETE NO_ACTION
);

-- Data exporting was unselected.

-- Dumping structure for table evya.ActiveAndSessionForChargingActivityData
CREATE TABLE IF NOT EXISTS "ActiveAndSessionForChargingActivityData" (
	"sessionId" VARCHAR(255) COLLATE SQL_Latin1_General_CP1_CI_AS,
	"RequestedID" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"appVersion" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"connectorId" NUMERIC(19,0),
	"messageType" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"meterStart" FLOAT,
	"orgId" NUMERIC(19,0),
	"portalStation" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"rfId" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"sessionStatus" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"stationId" NUMERIC(19,0),
	"status" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"statusMobile" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"transactionId" NUMERIC(19,0),
	"userId" NUMERIC(19,0),
	PRIMARY KEY ("sessionId")
);

-- Data exporting was unselected.

-- Dumping structure for table evya.address
CREATE TABLE IF NOT EXISTS "address" (
	"id" NUMERIC(19,0),
	"address" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"city" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"country" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"phone" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"state" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"zipCode" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"user_id" NUMERIC(19,0) DEFAULT NULL,
	FOREIGN KEY INDEX "FKk2ccr0qq8ou8l47ln7s4g2t66" ("user_id"),
	PRIMARY KEY ("id"),
	CONSTRAINT "FKk2ccr0qq8ou8l47ln7s4g2t66" FOREIGN KEY ("user_id") REFERENCES "Users" ("id") ON UPDATE NO_ACTION ON DELETE NO_ACTION
);

-- Data exporting was unselected.

-- Dumping structure for table evya.charger_details
CREATE TABLE IF NOT EXISTS "charger_details" (
	"id" NUMERIC(19,0),
	"chargerType" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"currentType" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"portQuantity" INT,
	"totalCapacityKW" FLOAT DEFAULT NULL,
	"manufacturer_id" NUMERIC(19,0) DEFAULT NULL,
	FOREIGN KEY INDEX "FKfo1679ma8qhs30gs0iu3e6tou" ("manufacturer_id"),
	PRIMARY KEY ("id"),
	CONSTRAINT "FKfo1679ma8qhs30gs0iu3e6tou" FOREIGN KEY ("manufacturer_id") REFERENCES "manufacturer_details" ("id") ON UPDATE NO_ACTION ON DELETE NO_ACTION
);

-- Data exporting was unselected.

-- Dumping structure for table evya.chargingActivity
CREATE TABLE IF NOT EXISTS "chargingActivity" (
	"id" NUMERIC(19,0),
	"connectorId" INT,
	"durationInSec" FLOAT,
	"endSOC" FLOAT,
	"endTime" DATETIME DEFAULT NULL,
	"energyDelivered" FLOAT,
	"kwConsuption" FLOAT,
	"location" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"ownerId" NUMERIC(19,0),
	"phonenumber" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"portCapacity" FLOAT,
	"portId" NUMERIC(19,0),
	"revenue" FLOAT,
	"sessionId" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"siteId" NUMERIC(19,0),
	"sitename" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"startSOC" FLOAT,
	"startTime" DATETIME DEFAULT NULL,
	"stationId" NUMERIC(19,0),
	"stationName" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"transcationId" NUMERIC(19,0),
	"userId" NUMERIC(19,0),
	"user_email" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"ownerOrg" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"portName" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"whiteLabelId" NUMERIC(19,0),
	"whiteLabelOrg" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	PRIMARY KEY ("id")
);

-- Data exporting was unselected.

-- Dumping structure for table evya.connector_details
CREATE TABLE IF NOT EXISTS "connector_details" (
	"id" NUMERIC(19,0),
	"connectorType" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"maxInputVoltageV" FLOAT DEFAULT NULL,
	"maxOutputVoltageV" FLOAT DEFAULT NULL,
	"outputCurrentA" FLOAT DEFAULT NULL,
	"portCapacityKW" FLOAT DEFAULT NULL,
	"portDisplayName" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"charger_id" NUMERIC(19,0) DEFAULT NULL,
	FOREIGN KEY INDEX "FK8bt5jjdenpi9b8qcgf0dqqgir" ("charger_id"),
	PRIMARY KEY ("id"),
	CONSTRAINT "FK8bt5jjdenpi9b8qcgf0dqqgir" FOREIGN KEY ("charger_id") REFERENCES "charger_details" ("id") ON UPDATE NO_ACTION ON DELETE NO_ACTION
);

-- Data exporting was unselected.

-- Dumping structure for table evya.device_details
CREATE TABLE IF NOT EXISTS "device_details" (
	"id" NUMERIC(19,0),
	"appVersion" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"deviceName" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"deviceToken" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"deviceType" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"deviceVersion" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"userId" NUMERIC(19,0),
	PRIMARY KEY ("id")
);

-- Data exporting was unselected.

-- Dumping structure for table evya.driver
CREATE TABLE IF NOT EXISTS "driver" (
	"id" NUMERIC(19,0),
	"address" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"email" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"licenseNumber" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"name" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"phone" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"status" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"fleet_id" NUMERIC(19,0) DEFAULT NULL,
	"vehicle_id" NUMERIC(19,0) DEFAULT NULL,
	FOREIGN KEY INDEX "FK1q37m7x7bwj1unpp4ike4vo41" ("fleet_id"),
	FOREIGN KEY INDEX "FKai2tl0dyesgla3tpjpsswy8ai" ("vehicle_id"),
	PRIMARY KEY ("id"),
	CONSTRAINT "FK1q37m7x7bwj1unpp4ike4vo41" FOREIGN KEY ("fleet_id") REFERENCES "fleet_details" ("id") ON UPDATE NO_ACTION ON DELETE NO_ACTION,
	CONSTRAINT "FKai2tl0dyesgla3tpjpsswy8ai" FOREIGN KEY ("vehicle_id") REFERENCES "fleet_vehicle" ("id") ON UPDATE NO_ACTION ON DELETE NO_ACTION
);

-- Data exporting was unselected.

-- Dumping structure for table evya.employee
CREATE TABLE IF NOT EXISTS "employee" (
	"id" NUMERIC(19,0),
	"active" BIT,
	"designation" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"email" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"fullname" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"joiningDate" DATETIME DEFAULT NULL,
	"location" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"mobileNumber" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"username" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	PRIMARY KEY ("id")
);

-- Data exporting was unselected.

-- Dumping structure for table evya.ev_brands
CREATE TABLE IF NOT EXISTS "ev_brands" (
	"id" NUMERIC(19,0),
	"brand_name" VARCHAR(50) COLLATE SQL_Latin1_General_CP1_CI_AS,
	PRIMARY KEY ("id")
);

-- Data exporting was unselected.

-- Dumping structure for table evya.ev_models
CREATE TABLE IF NOT EXISTS "ev_models" (
	"id" NUMERIC(19,0),
	"model" VARCHAR(255) COLLATE SQL_Latin1_General_CP1_CI_AS,
	"brand_id" NUMERIC(19,0) DEFAULT NULL,
	FOREIGN KEY INDEX "FKm1tot30aqe3meyp69mwx2nks7" ("brand_id"),
	PRIMARY KEY ("id"),
	CONSTRAINT "FKm1tot30aqe3meyp69mwx2nks7" FOREIGN KEY ("brand_id") REFERENCES "ev_brands" ("id") ON UPDATE NO_ACTION ON DELETE NO_ACTION
);

-- Data exporting was unselected.

-- Dumping structure for table evya.ev_variants
CREATE TABLE IF NOT EXISTS "ev_variants" (
	"id" NUMERIC(19,0),
	"battery_capacity_kwh" FLOAT DEFAULT NULL,
	"charger_type" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"charging_options" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"power" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"range_km" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"variant_name" VARCHAR(255) COLLATE SQL_Latin1_General_CP1_CI_AS,
	"model_id" NUMERIC(19,0) DEFAULT NULL,
	FOREIGN KEY INDEX "FKi9knl4lf4phq111yquhhe7bq9" ("model_id"),
	PRIMARY KEY ("id"),
	CONSTRAINT "FKi9knl4lf4phq111yquhhe7bq9" FOREIGN KEY ("model_id") REFERENCES "ev_models" ("id") ON UPDATE NO_ACTION ON DELETE NO_ACTION
);

-- Data exporting was unselected.

-- Dumping structure for table evya.fav_sites
CREATE TABLE IF NOT EXISTS "fav_sites" (
	"id" NUMERIC(19,0),
	"site_id" NUMERIC(19,0) DEFAULT NULL,
	"user_id" NUMERIC(19,0) DEFAULT NULL,
	FOREIGN KEY INDEX "FKem662choaho9cuofti8jt8fkv" ("user_id"),
	FOREIGN KEY INDEX "FKkqbrvxhdeimuqck8blxrcfn37" ("site_id"),
	PRIMARY KEY ("id"),
	CONSTRAINT "FKem662choaho9cuofti8jt8fkv" FOREIGN KEY ("user_id") REFERENCES "Users" ("id") ON UPDATE NO_ACTION ON DELETE NO_ACTION,
	CONSTRAINT "FKkqbrvxhdeimuqck8blxrcfn37" FOREIGN KEY ("site_id") REFERENCES "site" ("id") ON UPDATE NO_ACTION ON DELETE NO_ACTION
);

-- Data exporting was unselected.

-- Dumping structure for table evya.fleet_details
CREATE TABLE IF NOT EXISTS "fleet_details" (
	"id" NUMERIC(19,0),
	"baseLocation" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"created_date" DATETIME DEFAULT NULL,
	"fleetName" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"ownerEmail" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"ownerName" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"ownerPhone" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"status" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"expiryDate" DATETIME DEFAULT NULL,
	"fleet_code" VARCHAR(255) COLLATE SQL_Latin1_General_CP1_CI_AS,
	"rfid" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"rfidStatus" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	PRIMARY KEY ("id"),
	UNIQUE INDEX "UK_31d07kmlyaglhpfolro4q3ku5" ("fleet_code")
);

-- Data exporting was unselected.

-- Dumping structure for table evya.fleet_vehicle
CREATE TABLE IF NOT EXISTS "fleet_vehicle" (
	"id" NUMERIC(19,0),
	"batteryLeft" FLOAT DEFAULT NULL,
	"bookings" INT DEFAULT NULL,
	"capacityKw" FLOAT DEFAULT NULL,
	"driver" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"location" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"model" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"status" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"vehicleNumber" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"fleet_id" NUMERIC(19,0) DEFAULT NULL,
	"make" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"registrationNumber" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"variantName" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"vehicleName" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"vehicleType" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"vinNumber" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"year" INT DEFAULT NULL,
	"user_id" NUMERIC(19,0) DEFAULT NULL,
	"variant_id" NUMERIC(19,0) DEFAULT NULL,
	FOREIGN KEY INDEX "FK26l823l952bgta5s39bsapyck" ("variant_id"),
	FOREIGN KEY INDEX "FKo6nqdmrq58f0sxjt06c5j9748" ("user_id"),
	FOREIGN KEY INDEX "FKrpj0wlqmx1othw07fgnc1f4v8" ("fleet_id"),
	PRIMARY KEY ("id"),
	CONSTRAINT "FKo6nqdmrq58f0sxjt06c5j9748" FOREIGN KEY ("user_id") REFERENCES "Users" ("id") ON UPDATE NO_ACTION ON DELETE NO_ACTION,
	CONSTRAINT "FK26l823l952bgta5s39bsapyck" FOREIGN KEY ("variant_id") REFERENCES "ev_variants" ("id") ON UPDATE NO_ACTION ON DELETE NO_ACTION,
	CONSTRAINT "FKrpj0wlqmx1othw07fgnc1f4v8" FOREIGN KEY ("fleet_id") REFERENCES "fleet_details" ("id") ON UPDATE NO_ACTION ON DELETE NO_ACTION
);

-- Data exporting was unselected.

-- Dumping structure for table evya.issue_notes
CREATE TABLE IF NOT EXISTS "issue_notes" (
	"id" NUMERIC(19,0),
	"createdBy" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"lastModifiedBy" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"modifiedDate" DATETIME DEFAULT NULL,
	"notes" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"title" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"issue_reporting_id" NUMERIC(19,0) DEFAULT NULL,
	FOREIGN KEY INDEX "FKbnnwqq2swa546f467yi25g4w7" ("issue_reporting_id"),
	PRIMARY KEY ("id"),
	CONSTRAINT "FKbnnwqq2swa546f467yi25g4w7" FOREIGN KEY ("issue_reporting_id") REFERENCES "issue_reporting" ("id") ON UPDATE NO_ACTION ON DELETE NO_ACTION
);

-- Data exporting was unselected.

-- Dumping structure for table evya.issue_reporting
CREATE TABLE IF NOT EXISTS "issue_reporting" (
	"id" NUMERIC(19,0),
	"category" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"categoryId" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"comment" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"createdDate" DATETIME DEFAULT NULL,
	"email" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"issue" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"mobileNumber" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"orgId" NUMERIC(19,0) DEFAULT NULL,
	"priority" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"status" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"ticketId" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"type" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"userId" NUMERIC(19,0) DEFAULT NULL,
	"employee_id" NUMERIC(19,0) DEFAULT NULL,
	FOREIGN KEY INDEX "FKb8wvg2caqbffw8og2mhgr0ylr" ("employee_id"),
	PRIMARY KEY ("id"),
	CONSTRAINT "FKb8wvg2caqbffw8og2mhgr0ylr" FOREIGN KEY ("employee_id") REFERENCES "employee" ("id") ON UPDATE NO_ACTION ON DELETE NO_ACTION
);

-- Data exporting was unselected.

-- Dumping structure for table evya.local_list
CREATE TABLE IF NOT EXISTS "local_list" (
	"id" NUMERIC(19,0),
	"idTag" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"stationId" NUMERIC(19,0),
	"versionNumber" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	PRIMARY KEY ("id")
);

-- Data exporting was unselected.

-- Dumping structure for table evya.manufacturer_details
CREATE TABLE IF NOT EXISTS "manufacturer_details" (
	"id" NUMERIC(19,0),
	"contactInfo" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"country" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"manufacturerName" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"mobileNumber" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	PRIMARY KEY ("id")
);

-- Data exporting was unselected.

-- Dumping structure for table evya.month
CREATE TABLE IF NOT EXISTS "month" (
	"id" NUMERIC(19,0),
	"monthName" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	PRIMARY KEY ("id"),
	UNIQUE INDEX "UKngstpj0c2l3ihqy9xt8pp09a6" ("monthName")
);

-- Data exporting was unselected.

-- Dumping structure for table evya.notes
CREATE TABLE IF NOT EXISTS "notes" (
	"id" NUMERIC(19,0),
	"created_by_role" VARCHAR(255) COLLATE SQL_Latin1_General_CP1_CI_AS,
	"created_date" DATETIME DEFAULT NULL,
	"description" TEXT DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"title" VARCHAR(200) COLLATE SQL_Latin1_General_CP1_CI_AS,
	"employee_id" NUMERIC(19,0),
	"issue_id" NUMERIC(19,0) DEFAULT NULL,
	"recipient_id" NUMERIC(19,0),
	"task_id" NUMERIC(19,0) DEFAULT NULL,
	FOREIGN KEY INDEX "FK1vil4mxu1w36l5ffmi5fu7s50" ("recipient_id"),
	FOREIGN KEY INDEX "FK57ciopx5w14ebwgw1t42wndqv" ("employee_id"),
	FOREIGN KEY INDEX "FK9te7i275h5db0x2gkbf2tq2bq" ("task_id"),
	FOREIGN KEY INDEX "FKj085i2cg09yygyxbrq82c9khc" ("issue_id"),
	PRIMARY KEY ("id"),
	CONSTRAINT "FK9te7i275h5db0x2gkbf2tq2bq" FOREIGN KEY ("task_id") REFERENCES "task_assignment" ("id") ON UPDATE NO_ACTION ON DELETE NO_ACTION,
	CONSTRAINT "FK57ciopx5w14ebwgw1t42wndqv" FOREIGN KEY ("employee_id") REFERENCES "employee" ("id") ON UPDATE NO_ACTION ON DELETE NO_ACTION,
	CONSTRAINT "FK1vil4mxu1w36l5ffmi5fu7s50" FOREIGN KEY ("recipient_id") REFERENCES "employee" ("id") ON UPDATE NO_ACTION ON DELETE NO_ACTION,
	CONSTRAINT "FKj085i2cg09yygyxbrq82c9khc" FOREIGN KEY ("issue_id") REFERENCES "issue_reporting" ("id") ON UPDATE NO_ACTION ON DELETE NO_ACTION
);

-- Data exporting was unselected.

-- Dumping structure for table evya.OCPPChargingSchedulePeriod
CREATE TABLE IF NOT EXISTS "OCPPChargingSchedulePeriod" (
	"id" NUMERIC(19,0),
	"chargingProfileId" NUMERIC(19,0),
	"numberPhases" NUMERIC(19,0),
	"portId" NUMERIC(19,0),
	"startPeriod" NUMERIC(19,0),
	"stationId" NUMERIC(19,0),
	PRIMARY KEY ("id")
);

-- Data exporting was unselected.

-- Dumping structure for table evya.ocpp_activeSession
CREATE TABLE IF NOT EXISTS "ocpp_activeSession" (
	"id" NUMERIC(19,0),
	"sessionId" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"sessionStatus" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"stationRefNum" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	PRIMARY KEY ("id")
);

-- Data exporting was unselected.

-- Dumping structure for table evya.ocpp_activeTransaction
CREATE TABLE IF NOT EXISTS "ocpp_activeTransaction" (
	"id" NUMERIC(19,0),
	"appVersion" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"connectorId" NUMERIC(19,0),
	"messageType" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"meterStart" FLOAT,
	"orgId" NUMERIC(19,0) DEFAULT NULL,
	"portalStation" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"requestedID" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"rfId" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"sessionId" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"sessionStatus" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"stationId" NUMERIC(19,0),
	"status" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"statusMobile" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"timeStamp" DATETIME DEFAULT NULL,
	"transactionId" NUMERIC(19,0),
	"userId" NUMERIC(19,0),
	PRIMARY KEY ("id")
);

-- Data exporting was unselected.

-- Dumping structure for table evya.ocpp_bootNotification
CREATE TABLE IF NOT EXISTS "ocpp_bootNotification" (
	"id" NUMERIC(19,0),
	"bootTime" DATETIME DEFAULT NULL,
	"chargeBoxSerialNumber" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"chargePointModel" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"chargePointSerialNumber" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"chargePointVendor" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"configurationKeys" BIT,
	"firmwareVersion" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"requestId" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"stationId" NUMERIC(19,0),
	PRIMARY KEY ("id")
);

-- Data exporting was unselected.

-- Dumping structure for table evya.ocpp_changeAvailability
CREATE TABLE IF NOT EXISTS "ocpp_changeAvailability" (
	"id" NUMERIC(19,0),
	"connectorId" NUMERIC(19,0),
	"modeType" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"portId" NUMERIC(19,0),
	"portalReqID" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"startTimeStamp" DATETIME DEFAULT NULL,
	"stationId" NUMERIC(19,0),
	PRIMARY KEY ("id")
);

-- Data exporting was unselected.

-- Dumping structure for table evya.ocpp_chargingintervaldata
CREATE TABLE IF NOT EXISTS "ocpp_chargingintervaldata" (
	"id" NUMERIC(19,0),
	"endInterval" DATETIME DEFAULT NULL,
	"endTimestamp" DATETIME DEFAULT NULL,
	"idTag" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"intervalDuration" FLOAT,
	"kWUsed" FLOAT,
	"nextIntervalTimestamp" DATETIME DEFAULT NULL,
	"portId" NUMERIC(19,0),
	"portPrice" FLOAT,
	"portPriceUnit" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"powerActiveImport" FLOAT,
	"reasonForTermination" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"sessionId" NUMERIC(19,0),
	"spent" FLOAT,
	"startInterval" DATETIME DEFAULT NULL,
	"startTimestamp" DATETIME DEFAULT NULL,
	"stationId" NUMERIC(19,0),
	"transactionCost" FLOAT,
	"userId" NUMERIC(19,0) DEFAULT NULL,
	PRIMARY KEY ("id")
);

-- Data exporting was unselected.

-- Dumping structure for table evya.ocpp_chargingProfile
CREATE TABLE IF NOT EXISTS "ocpp_chargingProfile" (
	"id" NUMERIC(19,0),
	"chargingProfileId" NUMERIC(19,0),
	"chargingProfileKind" VARCHAR(50) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"chargingProfilePurpose" VARCHAR(50) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"chargingRateUnit" VARCHAR(50) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"duration" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"portId" NUMERIC(19,0) DEFAULT NULL,
	"recurrencyKind" VARCHAR(50) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"stackLevel" NUMERIC(19,0) DEFAULT NULL,
	"stationId" NUMERIC(19,0),
	"validFrom" VARCHAR(50) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"validTo" VARCHAR(50) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	PRIMARY KEY ("id")
);

-- Data exporting was unselected.

-- Dumping structure for table evya.ocpp_dataTransfer
CREATE TABLE IF NOT EXISTS "ocpp_dataTransfer" (
	"id" NUMERIC(19,0),
	"ccTransactionId" NUMERIC(19,0),
	"connectorId" NUMERIC(19,0),
	"messageId" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"mobileNumber" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"ocppTransactionId" NUMERIC(19,0),
	"price" FLOAT,
	"startTimeStamp" DATETIME DEFAULT NULL,
	"vendor" NUMERIC(19,0),
	PRIMARY KEY ("id")
);

-- Data exporting was unselected.

-- Dumping structure for table evya.ocpp_heartBeat
CREATE TABLE IF NOT EXISTS "ocpp_heartBeat" (
	"id" NUMERIC(19,0),
	"heartBeatTime" DATETIME DEFAULT NULL,
	"reportingMailFlag" NUMERIC(19,0) DEFAULT '(0)',
	"stationId" NUMERIC(19,0),
	"triggerMessage" INT,
	PRIMARY KEY ("id")
);

-- Data exporting was unselected.

-- Dumping structure for table evya.ocpp_meterValue
CREATE TABLE IF NOT EXISTS "ocpp_meterValue" (
	"id" NUMERIC(19,0),
	"connectorId" NUMERIC(19,0),
	"currentImport_Value" FLOAT,
	"engActImpRegr_Value" FLOAT,
	"finalCost" FLOAT,
	"powerActiveImport" FLOAT,
	"reqId" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"sessionId" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"soc" FLOAT,
	"startTimeStamp" DATETIME DEFAULT NULL,
	"stationId" NUMERIC(19,0),
	"status" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"timeStamp" DATETIME DEFAULT NULL,
	"transactionId" NUMERIC(19,0),
	"unit" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"value" FLOAT,
	PRIMARY KEY ("id")
);

-- Data exporting was unselected.

-- Dumping structure for table evya.ocpp_phoneNumber
CREATE TABLE IF NOT EXISTS "ocpp_phoneNumber" (
	"id" NUMERIC(19,0),
	"accountId" NUMERIC(19,0),
	"duration" FLOAT,
	"stationId" NUMERIC(19,0),
	PRIMARY KEY ("id")
);

-- Data exporting was unselected.

-- Dumping structure for table evya.ocpp_remoteStartTransaction
CREATE TABLE IF NOT EXISTS "ocpp_remoteStartTransaction" (
	"id" NUMERIC(19,0),
	"connectorId" NUMERIC(19,0),
	"endTime" DATETIME DEFAULT NULL,
	"idTag" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"portId" NUMERIC(19,0),
	"portalStation" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"sessionId" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"startTime" DATETIME DEFAULT NULL,
	"stationId" NUMERIC(19,0),
	"status" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"userId" NUMERIC(19,0),
	PRIMARY KEY ("id")
);

-- Data exporting was unselected.

-- Dumping structure for table evya.ocpp_remoteStopTransaction
CREATE TABLE IF NOT EXISTS "ocpp_remoteStopTransaction" (
	"id" NUMERIC(19,0),
	"connectorId" NUMERIC(19,0),
	"portalStation" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"requestID" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"sessionId" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"stationId" NUMERIC(19,0),
	"status" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"transactionId" NUMERIC(19,0),
	PRIMARY KEY ("id")
);

-- Data exporting was unselected.

-- Dumping structure for table evya.ocpp_reservation
CREATE TABLE IF NOT EXISTS "ocpp_reservation" (
	"id" NUMERIC(19,0),
	"connectorId" NUMERIC(19,0),
	"endTime" DATETIME DEFAULT NULL,
	"flag" BIT,
	"idTag" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"portId" NUMERIC(19,0),
	"reqId" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"reservationId" NUMERIC(19,0),
	"sessionId" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"startTime" DATETIME DEFAULT NULL,
	"stationId" NUMERIC(19,0),
	"status" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"userId" NUMERIC(19,0),
	PRIMARY KEY ("id")
);

-- Data exporting was unselected.

-- Dumping structure for table evya.ocpp_reset
CREATE TABLE IF NOT EXISTS "ocpp_reset" (
	"id" NUMERIC(19,0),
	"requestID" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"resetDate" DATETIME DEFAULT NULL,
	"resetType" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"status" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	PRIMARY KEY ("id")
);

-- Data exporting was unselected.

-- Dumping structure for table evya.ocpp_resetretrie
CREATE TABLE IF NOT EXISTS "ocpp_resetretrie" (
	"id" NUMERIC(19,0),
	"count" INT,
	"messageType" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"stationId" NUMERIC(19,0),
	"status" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	PRIMARY KEY ("id")
);

-- Data exporting was unselected.

-- Dumping structure for table evya.ocpp_sessionData
CREATE TABLE IF NOT EXISTS "ocpp_sessionData" (
	"id" NUMERIC(19,0),
	"connectedNotify" BIT,
	"connectorId" NUMERIC(19,0),
	"durationAlert" BIT,
	"endTime" DATETIME DEFAULT NULL,
	"energyActiveImportRegisterUnit" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"energyCounsumptionFlag" BIT,
	"errorCode" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"firstMeterValue" BIT,
	"firstReading" FLOAT,
	"idTag" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"idTagStatus" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"kWhAlert" BIT,
	"kilowattHoursUsed" FLOAT,
	"lastReading" FLOAT,
	"notificationStatus" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"notificationTimeStamp" DATETIME DEFAULT NULL,
	"revenue" FLOAT,
	"revenueAlert" BIT,
	"rfId" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"sessionId" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"startRequestId" NUMERIC(19,0),
	"startTime" DATETIME DEFAULT NULL,
	"stationId" NUMERIC(19,0),
	"stopRequestId" NUMERIC(19,0),
	"timeStamp" DATETIME DEFAULT NULL,
	"transactionId" NUMERIC(19,0),
	"unit" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"value" NUMERIC(19,0),
	"wattSecondsUsed" FLOAT,
	"wattSecondsUsedCount" NUMERIC(19,0),
	PRIMARY KEY ("id")
);

-- Data exporting was unselected.

-- Dumping structure for table evya.ocpp_startTransaction
CREATE TABLE IF NOT EXISTS "ocpp_startTransaction" (
	"id" NUMERIC(19,0),
	"connectorId" NUMERIC(19,0),
	"customerId" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"emailId" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"endTime" DATETIME DEFAULT NULL,
	"idTag" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"meterStart" FLOAT DEFAULT NULL,
	"offlineFlag" BIT DEFAULT '(0)',
	"plugInEndTime" DATETIME DEFAULT NULL,
	"plugInStartTime" DATETIME DEFAULT NULL,
	"requestedID" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"reservationFee" FLOAT,
	"reservationId" NUMERIC(19,0),
	"sessionId" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"stationId" NUMERIC(19,0),
	"timeStamp" DATETIME DEFAULT NULL,
	"transactionId" NUMERIC(19,0),
	"transactionStatus" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"unPluged" BIT,
	"userId" NUMERIC(19,0),
	PRIMARY KEY ("id")
);

-- Data exporting was unselected.

-- Dumping structure for table evya.ocpp_stationConfigForBootNoti
CREATE TABLE IF NOT EXISTS "ocpp_stationConfigForBootNoti" (
	"id" NUMERIC(19,0),
	"allowOfflineTxForUnknownId" BIT,
	"authorizationCacheEnabled" BIT,
	"authorizeRemoteTxRequests" BIT,
	"availablePaymentType" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"blinkRepeat" NUMERIC(19,0),
	"chargeBoxName" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"chargeBoxTimeZone" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"chargeProfileMaxStackLevel" NUMERIC(19,0),
	"chargingScheduleAllowedChargingRateUnit" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"chargingScheduleMaxPeriods" NUMERIC(19,0),
	"clockAlignedDataInterval" NUMERIC(19,0),
	"connectionTimeOut" NUMERIC(19,0),
	"connectorPhaseRotation" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"connectorPhaseRotationMaxLength" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"connectorSwitch3to1PhaseSupported" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"contactCenter" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"creditCardIdTag" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"defaultTag" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"flagValue" BIT,
	"freeMode" NUMERIC(19,0),
	"freevendEnabled" NUMERIC(19,0),
	"freevendIdTag" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"getConfigurationMaxKeys" NUMERIC(19,0),
	"heartbeatInterval" NUMERIC(19,0),
	"lightIntensity" NUMERIC(19,0),
	"localAuthListEnabled" NUMERIC(19,0),
	"localAuthorizeOffline" BIT,
	"localPreAuthorize" BIT,
	"maxChargingProfilesInstalled" NUMERIC(19,0),
	"maxChargingTime" NUMERIC(19,0),
	"maxChargingTimeEnabled" BIT,
	"maxEnergyOnInvalidId" NUMERIC(19,0),
	"maxSOCLimit" NUMERIC(19,0),
	"meterValueSampleInterval" NUMERIC(19,0),
	"meterValuesAlignedData" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"meterValuesAlignedDataMaxLength" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"meterValuesSampledData" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"meterValuesSampledDataMaxLength" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"minimumStatusDuration" NUMERIC(19,0),
	"numberOfConnectors" NUMERIC(19,0),
	"ocppEndpointToBackend" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"qrCodeContent" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"ratedPMax" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"reserveConnectorZeroSupported" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"resetRetries" NUMERIC(19,0),
	"sendLocalListMaxLength" NUMERIC(19,0),
	"silentFreevendEnabled" BIT,
	"stationId" NUMERIC(19,0),
	"stopButtoninFreeMode" NUMERIC(19,0),
	"stopTransactionOnEVSideDisconnect" BIT,
	"stopTransactionOnInvalidId" BIT,
	"stopTxnAlignedData" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"stopTxnAlignedDataMaxLength" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"stopTxnSampledData" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"stopTxnSampledDataMaxLength" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"supportedFeatureProfiles" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"supportedFeatureProfilesMaxLength" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"transactionMessageAttempts" NUMERIC(19,0),
	"transactionMessageRetryInterval" NUMERIC(19,0),
	"unlockConnectorOnEVSideDisconnect" BIT,
	"webSocketPingInterval" NUMERIC(19,0),
	"authorizationRequired" BIT,
	"coreRemoteTrigger" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"firmwareVersion" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"nonAuthorizedTag" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	PRIMARY KEY ("id")
);

-- Data exporting was unselected.

-- Dumping structure for table evya.ocpp_statusSendingData
CREATE TABLE IF NOT EXISTS "ocpp_statusSendingData" (
	"id" NUMERIC(19,0),
	"client" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"configurationKey" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"connectorId" NUMERIC(19,0),
	"createdDate" DATETIME DEFAULT NULL,
	"data" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"messageType" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"portalReqID" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"requestId" NUMERIC(19,0) DEFAULT NULL,
	"response" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"sessionId" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"stationId" NUMERIC(19,0),
	"status" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"userId" NUMERIC(19,0),
	"value" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	PRIMARY KEY ("id")
);

-- Data exporting was unselected.

-- Dumping structure for table evya.ocpp_stopTransaction
CREATE TABLE IF NOT EXISTS "ocpp_stopTransaction" (
	"id" NUMERIC(19,0),
	"connectorId" NUMERIC(19,0),
	"idTag" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"meterStop" FLOAT DEFAULT NULL,
	"portId" NUMERIC(19,0),
	"reason" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"sessionId" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"stationId" NUMERIC(19,0),
	"status" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"timeStamp" DATETIME DEFAULT NULL,
	"transactionId" NUMERIC(19,0),
	PRIMARY KEY ("id")
);

-- Data exporting was unselected.

-- Dumping structure for table evya.ocpp_triggerMessage
CREATE TABLE IF NOT EXISTS "ocpp_triggerMessage" (
	"id" NUMERIC(19,0),
	"count" INT,
	"stationId" NUMERIC(19,0),
	"status" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"triggerMessage" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	PRIMARY KEY ("id")
);

-- Data exporting was unselected.

-- Dumping structure for table evya.ocpp_unknownResponse
CREATE TABLE IF NOT EXISTS "ocpp_unknownResponse" (
	"id" NUMERIC(19,0),
	"crtDate" DATETIME DEFAULT NULL,
	"requestType" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"stationId" NUMERIC(19,0),
	PRIMARY KEY ("id")
);

-- Data exporting was unselected.

-- Dumping structure for table evya.ocpp_unlockConnector
CREATE TABLE IF NOT EXISTS "ocpp_unlockConnector" (
	"id" NUMERIC(19,0),
	"messageType" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"portId" NUMERIC(19,0),
	"reqId" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"stationId" NUMERIC(19,0),
	PRIMARY KEY ("id")
);

-- Data exporting was unselected.

-- Dumping structure for table evya.ocpp_updateFirmwareStatus
CREATE TABLE IF NOT EXISTS "ocpp_updateFirmwareStatus" (
	"id" NUMERIC(19,0),
	"crtDate" DATETIME DEFAULT NULL,
	"location" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"noOfTimesChargePointDownloaded" INT,
	"retryIntervalSec" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"stationId" NUMERIC(19,0),
	PRIMARY KEY ("id")
);

-- Data exporting was unselected.

-- Dumping structure for table evya.owner_orgs
CREATE TABLE IF NOT EXISTS "owner_orgs" (
	"id" NUMERIC(19,0),
	"driverFranchise" BIT,
	"orgName" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"whitelabelId" NUMERIC(19,0),
	PRIMARY KEY ("id"),
	UNIQUE INDEX "UKadntwj1pwnmuwoecuc1yvfbgu" ("orgName")
);

-- Data exporting was unselected.

-- Dumping structure for table evya.password
CREATE TABLE IF NOT EXISTS "password" (
	"id" NUMERIC(19,0),
	"createdAt" DATETIME DEFAULT NULL,
	"lastChangedDate" DATETIME DEFAULT NULL,
	"password" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"employee_id" NUMERIC(19,0) DEFAULT NULL,
	"user_id" NUMERIC(19,0) DEFAULT NULL,
	FOREIGN KEY INDEX "FKg43jkcqjg8g7qb4ma313fyxx" ("employee_id"),
	FOREIGN KEY INDEX "FKmfotru0fcrb8ytm9y6rybx918" ("user_id"),
	PRIMARY KEY ("id"),
	CONSTRAINT "FKmfotru0fcrb8ytm9y6rybx918" FOREIGN KEY ("user_id") REFERENCES "Users" ("id") ON UPDATE NO_ACTION ON DELETE NO_ACTION,
	CONSTRAINT "FKg43jkcqjg8g7qb4ma313fyxx" FOREIGN KEY ("employee_id") REFERENCES "employee" ("id") ON UPDATE NO_ACTION ON DELETE NO_ACTION
);

-- Data exporting was unselected.

-- Dumping structure for table evya.port
CREATE TABLE IF NOT EXISTS "port" (
	"id" NUMERIC(19,0),
	"billingAmount" FLOAT DEFAULT NULL,
	"billingUnits" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"connectorId" NUMERIC(19,0),
	"connectorName" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"connector_type" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"current_rating" FLOAT DEFAULT NULL,
	"max_power_kW" FLOAT DEFAULT NULL,
	"power_type" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"voltage_rating" FLOAT DEFAULT NULL,
	"connectordetails_id" NUMERIC(19,0) DEFAULT NULL,
	"station_id" NUMERIC(19,0) DEFAULT NULL,
	FOREIGN KEY INDEX "FK1f4d7ugc2scq7neaqmqc6uteb" ("connectordetails_id"),
	FOREIGN KEY INDEX "FKnj835ewblqp7ss0y7rpq1crcp" ("station_id"),
	PRIMARY KEY ("id"),
	CONSTRAINT "FKnj835ewblqp7ss0y7rpq1crcp" FOREIGN KEY ("station_id") REFERENCES "station" ("id") ON UPDATE NO_ACTION ON DELETE NO_ACTION,
	CONSTRAINT "FK1f4d7ugc2scq7neaqmqc6uteb" FOREIGN KEY ("connectordetails_id") REFERENCES "connector_details" ("id") ON UPDATE NO_ACTION ON DELETE NO_ACTION
);

-- Data exporting was unselected.

-- Dumping structure for table evya.referral_code
CREATE TABLE IF NOT EXISTS "referral_code" (
	"id" NUMERIC(19,0),
	"all_sites" BIT DEFAULT NULL,
	"offer_percentage" FLOAT DEFAULT NULL,
	"referral_code" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"valid_from" DATETIME DEFAULT NULL,
	"valid_to" DATETIME DEFAULT NULL,
	PRIMARY KEY ("id")
);

-- Data exporting was unselected.

-- Dumping structure for table evya.referral_code_sites
CREATE TABLE IF NOT EXISTS "referral_code_sites" (
	"referral_code_id" NUMERIC(19,0),
	"site_id" NUMERIC(19,0),
	FOREIGN KEY INDEX "FKf5eo8haaqhmu30e2kok3gu17e" ("site_id"),
	FOREIGN KEY INDEX "FKrxq7x1on6puvppam66elii3pe" ("referral_code_id"),
	PRIMARY KEY ("referral_code_id", "site_id"),
	CONSTRAINT "FKrxq7x1on6puvppam66elii3pe" FOREIGN KEY ("referral_code_id") REFERENCES "referral_code" ("id") ON UPDATE NO_ACTION ON DELETE NO_ACTION,
	CONSTRAINT "FKf5eo8haaqhmu30e2kok3gu17e" FOREIGN KEY ("site_id") REFERENCES "site" ("id") ON UPDATE NO_ACTION ON DELETE NO_ACTION
);

-- Data exporting was unselected.

-- Dumping structure for table evya.requested_franchises
CREATE TABLE IF NOT EXISTS "requested_franchises" (
	"id" NUMERIC(19,0),
	"address" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"category" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"chargerCapacity" FLOAT DEFAULT NULL,
	"email" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"franchiseName" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"latitude" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"longitude" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"mobileNumber" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"sitename" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"stationName" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"status" BIT,
	"owner_org_id" NUMERIC(19,0) DEFAULT NULL,
	"user_id" NUMERIC(19,0) DEFAULT NULL,
	"site_id" NUMERIC(19,0) DEFAULT NULL,
	FOREIGN KEY INDEX "FKb01fmytvdb1995ywqesle2roy" ("site_id"),
	FOREIGN KEY INDEX "FKeitus3bf8ug167ycsg5gnbure" ("owner_org_id"),
	FOREIGN KEY INDEX "FKn46fgukrh9vqin7gitw23p2vf" ("user_id"),
	PRIMARY KEY ("id"),
	CONSTRAINT "FKn46fgukrh9vqin7gitw23p2vf" FOREIGN KEY ("user_id") REFERENCES "Users" ("id") ON UPDATE NO_ACTION ON DELETE NO_ACTION,
	CONSTRAINT "FKeitus3bf8ug167ycsg5gnbure" FOREIGN KEY ("owner_org_id") REFERENCES "owner_orgs" ("id") ON UPDATE NO_ACTION ON DELETE NO_ACTION,
	CONSTRAINT "FKb01fmytvdb1995ywqesle2roy" FOREIGN KEY ("site_id") REFERENCES "site" ("id") ON UPDATE NO_ACTION ON DELETE NO_ACTION
);

-- Data exporting was unselected.

-- Dumping structure for table evya.rfid
CREATE TABLE IF NOT EXISTS "rfid" (
	"id" NUMERIC(19,0),
	"expiryDate" DATETIME DEFAULT NULL,
	"phone" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"rfId" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"rfidHex" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"status" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"userId" NUMERIC(19,0),
	"account_id" NUMERIC(19,0) DEFAULT NULL,
	FOREIGN KEY INDEX "FKrqo4nj6xr0wsm6vabl2akspin" ("account_id"),
	PRIMARY KEY ("id"),
	CONSTRAINT "FKrqo4nj6xr0wsm6vabl2akspin" FOREIGN KEY ("account_id") REFERENCES "accounts" ("id") ON UPDATE NO_ACTION ON DELETE NO_ACTION
);

-- Data exporting was unselected.

-- Dumping structure for table evya.rfid_request
CREATE TABLE IF NOT EXISTS "rfid_request" (
	"id" NUMERIC(19,0),
	"address" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"creationDate" DATETIME DEFAULT NULL,
	"dateGenerated" DATETIME DEFAULT NULL,
	"email" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"firstName" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"lastName" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"mobile" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"orderId" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"orgId" NUMERIC(19,0),
	"rfidCount" INT,
	"status" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"userId" NUMERIC(19,0),
	PRIMARY KEY ("id")
);

-- Data exporting was unselected.

-- Dumping structure for table evya.role
CREATE TABLE IF NOT EXISTS "role" (
	"id" NUMERIC(19,0),
	"rolename" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	PRIMARY KEY ("id"),
	UNIQUE INDEX "UKnctmxadhieiw7aduxjy4dfglt" ("rolename")
);

-- Data exporting was unselected.

-- Dumping structure for table evya.site
CREATE TABLE IF NOT EXISTS "site" (
	"id" NUMERIC(19,0),
	"managerEmail" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"managerName" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"managerPhone" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"ownerId" NUMERIC(19,0),
	"ownerOrg" NUMERIC(19,0),
	"siteName" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	PRIMARY KEY ("id"),
	UNIQUE INDEX "UKa3nj93q0ools3ehog8waeijin" ("siteName")
);

-- Data exporting was unselected.

-- Dumping structure for table evya.site_facilities
CREATE TABLE IF NOT EXISTS "site_facilities" (
	"id" NUMERIC(19,0),
	"food" BIT,
	"parking" BIT,
	"restrooms" BIT,
	"wifi" BIT,
	"site_id" NUMERIC(19,0) DEFAULT NULL,
	FOREIGN KEY INDEX "FKk2dhje3sftytuxf4eiacy7gtp" ("site_id"),
	PRIMARY KEY ("id"),
	CONSTRAINT "FKk2dhje3sftytuxf4eiacy7gtp" FOREIGN KEY ("site_id") REFERENCES "site" ("id") ON UPDATE NO_ACTION ON DELETE NO_ACTION
);

-- Data exporting was unselected.

-- Dumping structure for table evya.site_location
CREATE TABLE IF NOT EXISTS "site_location" (
	"id" NUMERIC(19,0),
	"address" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"latitude" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"longitude" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"site_id" NUMERIC(19,0) DEFAULT NULL,
	FOREIGN KEY INDEX "FKe4e41jocug4s2rvevn3hkd97d" ("site_id"),
	PRIMARY KEY ("id"),
	CONSTRAINT "FKe4e41jocug4s2rvevn3hkd97d" FOREIGN KEY ("site_id") REFERENCES "site" ("id") ON UPDATE NO_ACTION ON DELETE NO_ACTION
);

-- Data exporting was unselected.

-- Dumping structure for table evya.site_operations
CREATE TABLE IF NOT EXISTS "site_operations" (
	"id" NUMERIC(19,0),
	"closeTime" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"openingTime" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"siteStatus" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"timezone" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"site_id" NUMERIC(19,0) DEFAULT NULL,
	FOREIGN KEY INDEX "FKbcxda38r3awe1rf23i4juor42" ("site_id"),
	PRIMARY KEY ("id"),
	CONSTRAINT "FKbcxda38r3awe1rf23i4juor42" FOREIGN KEY ("site_id") REFERENCES "site" ("id") ON UPDATE NO_ACTION ON DELETE NO_ACTION
);

-- Data exporting was unselected.

-- Dumping structure for table evya.station
CREATE TABLE IF NOT EXISTS "station" (
	"id" NUMERIC(19,0),
	"OCPPId" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"communication_method" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"current_type" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"firmware_version" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"lastHeartBeat" DATETIME DEFAULT NULL,
	"manufacturerId" NUMERIC(19,0),
	"max_output_power_kW" FLOAT DEFAULT NULL,
	"model" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"number_of_ports" NUMERIC(19,0),
	"ocppVersion" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"plug_and_charger" BIT,
	"serialNo" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"stationName" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"stationStatus" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"v2G_support" BIT,
	"voltage_range" FLOAT DEFAULT NULL,
	"chargerdetails_id" NUMERIC(19,0) DEFAULT NULL,
	"site_id" NUMERIC(19,0) DEFAULT NULL,
	FOREIGN KEY INDEX "FK8iqfwahqvsqbq6n6wq7yr3dl0" ("site_id"),
	FOREIGN KEY INDEX "FKjbr0b3qg30e8p8mf4vlqlyuyr" ("chargerdetails_id"),
	PRIMARY KEY ("id"),
	CONSTRAINT "FKjbr0b3qg30e8p8mf4vlqlyuyr" FOREIGN KEY ("chargerdetails_id") REFERENCES "charger_details" ("id") ON UPDATE NO_ACTION ON DELETE NO_ACTION,
	CONSTRAINT "FK8iqfwahqvsqbq6n6wq7yr3dl0" FOREIGN KEY ("site_id") REFERENCES "site" ("id") ON UPDATE NO_ACTION ON DELETE NO_ACTION
);

-- Data exporting was unselected.

-- Dumping structure for table evya.stationUpAndDownTimeRecords
CREATE TABLE IF NOT EXISTS "stationUpAndDownTimeRecords" (
	"id" NUMERIC(19,0),
	"createdDate" DATETIME DEFAULT NULL,
	"downCount" INT,
	"intervalData" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"stationId" NUMERIC(19,0),
	"upCount" INT,
	PRIMARY KEY ("id")
);

-- Data exporting was unselected.

-- Dumping structure for table evya.statusNotification
CREATE TABLE IF NOT EXISTS "statusNotification" (
	"id" NUMERIC(19,0),
	"connectorId" NUMERIC(19,0) DEFAULT NULL,
	"lastContactedTime" DATETIME DEFAULT NULL,
	"stationId" NUMERIC(19,0),
	"status" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"port_id" NUMERIC(19,0) DEFAULT NULL,
	FOREIGN KEY INDEX "FK8o0em7r60lcrmh5d9089sqe3e" ("port_id"),
	PRIMARY KEY ("id"),
	CONSTRAINT "FK8o0em7r60lcrmh5d9089sqe3e" FOREIGN KEY ("port_id") REFERENCES "port" ("id") ON UPDATE NO_ACTION ON DELETE NO_ACTION
);

-- Data exporting was unselected.

-- Dumping structure for table evya.task_assignment
CREATE TABLE IF NOT EXISTS "task_assignment" (
	"id" NUMERIC(19,0),
	"createdAt" DATETIME DEFAULT NULL,
	"description" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"dueDate" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"location" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"priority" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"status" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"taskName" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"updatedAt" DATETIME DEFAULT NULL,
	"employee_id" NUMERIC(19,0),
	FOREIGN KEY INDEX "FK9g6ly30skmgkrssxdby9w9wm4" ("employee_id"),
	PRIMARY KEY ("id"),
	CONSTRAINT "FK9g6ly30skmgkrssxdby9w9wm4" FOREIGN KEY ("employee_id") REFERENCES "employee" ("id") ON UPDATE NO_ACTION ON DELETE NO_ACTION
);

-- Data exporting was unselected.

-- Dumping structure for table evya.Users
CREATE TABLE IF NOT EXISTS "Users" (
	"id" NUMERIC(19,0),
	"email" VARCHAR(50) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"enabled" BIT,
	"fullname" VARCHAR(50) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"mobileNumber" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"orgId" NUMERIC(19,0) DEFAULT NULL,
	"orgName" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"username" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	PRIMARY KEY ("id"),
	UNIQUE INDEX "UK23y4gd49ajvbqgl3psjsvhff6" ("username"),
	UNIQUE INDEX "UKn3xhdtxd83rj9dds15p1mgo66" ("mobileNumber"),
	UNIQUE INDEX "UKncoa9bfasrql0x4nhmh1plxxy" ("email")
);

-- Data exporting was unselected.

-- Dumping structure for table evya.usersinroles
CREATE TABLE IF NOT EXISTS "usersinroles" (
	"role_id" NUMERIC(19,0),
	"user_id" NUMERIC(19,0),
	FOREIGN KEY INDEX "FKfiudmra0sgy321yomltognckq" ("user_id"),
	PRIMARY KEY ("user_id"),
	CONSTRAINT "FKfiudmra0sgy321yomltognckq" FOREIGN KEY ("user_id") REFERENCES "Users" ("id") ON UPDATE NO_ACTION ON DELETE NO_ACTION
);

-- Data exporting was unselected.

-- Dumping structure for table evya.users_in_fleet
CREATE TABLE IF NOT EXISTS "users_in_fleet" (
	"id" NUMERIC(19,0),
	"fleet_id" NUMERIC(19,0) DEFAULT NULL,
	"user_id" NUMERIC(19,0) DEFAULT NULL,
	PRIMARY KEY ("id")
);

-- Data exporting was unselected.

-- Dumping structure for table evya.users_in_owners
CREATE TABLE IF NOT EXISTS "users_in_owners" (
	"id" NUMERIC(19,0),
	"owner_org_id" NUMERIC(19,0) DEFAULT NULL,
	"user_id" NUMERIC(19,0) DEFAULT NULL,
	PRIMARY KEY ("id")
);

-- Data exporting was unselected.

-- Dumping structure for table evya.users_in_whitelabels
CREATE TABLE IF NOT EXISTS "users_in_whitelabels" (
	"id" NUMERIC(19,0),
	"user_id" NUMERIC(19,0) DEFAULT NULL,
	"wl_org_id" NUMERIC(19,0) DEFAULT NULL,
	PRIMARY KEY ("id")
);

-- Data exporting was unselected.

-- Dumping structure for table evya.vehicles
CREATE TABLE IF NOT EXISTS "vehicles" (
	"id" NUMERIC(19,0),
	"connectorType" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"description" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"make" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"model" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"registrationNo" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"status" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"variant" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"vehicleType" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"vin" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"year" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	"user_id" NUMERIC(19,0) DEFAULT NULL,
	FOREIGN KEY INDEX "FKt3lqrkp4g6od8n6d9hof7x1dw" ("user_id"),
	PRIMARY KEY ("id"),
	CONSTRAINT "FKt3lqrkp4g6od8n6d9hof7x1dw" FOREIGN KEY ("user_id") REFERENCES "Users" ("id") ON UPDATE NO_ACTION ON DELETE NO_ACTION
);

-- Data exporting was unselected.

-- Dumping structure for table evya.white_lable_orgs
CREATE TABLE IF NOT EXISTS "white_lable_orgs" (
	"id" NUMERIC(19,0),
	"flag" BIT,
	"orgName" VARCHAR(255) DEFAULT NULL COLLATE SQL_Latin1_General_CP1_CI_AS,
	PRIMARY KEY ("id"),
	UNIQUE INDEX "UKn93hn7ot353c14g48wct9r3n6" ("orgName")
);

-- Data exporting was unselected.

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
