package com.evya.shipper;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * The shipper is the fix for SENSE-001 (nothing produced to the topic) and the source half of
 * SENSE-003 (log lines carry no charger identity, so the key has to supply it).
 */
class LogTailServiceTest {

    @TempDir
    Path root;

    private ShipperProperties properties;
    private RecordingPublisher publisher;
    private Path stateFile;

    @BeforeEach
    void setUp() {
        stateFile = root.resolve("state.properties");
        properties = new ShipperProperties();
        properties.setRoot(root.toString());
        properties.setStartAtEnd(false);
        properties.setStateFile(stateFile.toString());
        publisher = new RecordingPublisher();
    }

    private LogTailService newTailer() {
        return new LogTailService(properties, new OffsetStore(stateFile), publisher);
    }

    private Path logFor(String chargerId) throws IOException {
        Path dir = Files.createDirectories(root.resolve(chargerId));
        return dir.resolve("2026-09-21_" + chargerId + ".txt");
    }

    private void append(Path file, String text) throws IOException {
        Files.writeString(file, text, StandardCharsets.UTF_8,
                StandardOpenOption.CREATE, StandardOpenOption.APPEND);
    }

    @Test
    @DisplayName("Every line is keyed by the charger that produced it")
    void linesAreKeyedByCharger() throws Exception {
        Path one = logFor("LAB001");
        Path two = logFor("LAB002");

        append(one, "Mon Sep 21 00:00:04 IST 2026\tReceived Message : [2,\"a\",\"Heartbeat\",{}]\n");
        append(two, "Mon Sep 21 00:00:05 IST 2026\tReceived Message : [2,\"b\",\"Heartbeat\",{}]\n");
        append(one, "Mon Sep 21 00:00:06 IST 2026\tReceived Message : [2,\"c\",\"Heartbeat\",{}]\n");

        assertThat(newTailer().poll()).isEqualTo(3);

        // Without this, EvyaSense attributes all three to whichever charger connected most recently.
        assertThat(publisher.linesFor("LAB001")).hasSize(2).allMatch(l -> l.contains("Heartbeat"));
        assertThat(publisher.linesFor("LAB002")).hasSize(1);
        assertThat(publisher.sent).allMatch(p -> p.source().endsWith(".txt"));
    }

    @Test
    @DisplayName("A line still being written is held back until it is complete")
    void partialLinesAreNotShipped() throws Exception {
        Path file = logFor("LAB001");
        append(file, "complete line one\n");
        append(file, "still being writ");

        LogTailService tailer = newTailer();
        assertThat(tailer.poll()).isEqualTo(1);
        assertThat(publisher.linesFor("LAB001")).containsExactly("complete line one");

        append(file, "ten now\n");
        publisher.clear();

        assertThat(tailer.poll()).isEqualTo(1);
        assertThat(publisher.linesFor("LAB001")).containsExactly("still being written now");
    }

    @Test
    @DisplayName("A restart resumes where it stopped, without repeating or dropping lines")
    void restartResumesFromTheCheckpoint() throws Exception {
        Path file = logFor("LAB001");
        append(file, "line one\nline two\n");

        assertThat(newTailer().poll()).isEqualTo(2);
        publisher.clear();

        append(file, "line three\n");

        // A fresh tailer and a fresh OffsetStore: the same situation as a process restart.
        assertThat(newTailer().poll()).isEqualTo(1);
        assertThat(publisher.linesFor("LAB001")).containsExactly("line three");
    }

    @Test
    @DisplayName("A rotated or truncated file is re-read from the start rather than skipped")
    void truncationRestartsTheFile() throws Exception {
        Path file = logFor("LAB001");
        append(file, "old line one\nold line two\nold line three\n");

        assertThat(newTailer().poll()).isEqualTo(3);
        publisher.clear();

        Files.writeString(file, "fresh line\n", StandardCharsets.UTF_8,
                StandardOpenOption.TRUNCATE_EXISTING);

        assertThat(newTailer().poll()).isEqualTo(1);
        assertThat(publisher.linesFor("LAB001")).containsExactly("fresh line");
    }

    @Test
    @DisplayName("With start-at-end, an existing backlog is tracked but not replayed")
    void startAtEndSkipsTheBacklog() throws Exception {
        Path file = logFor("LAB001");
        append(file, "historic one\nhistoric two\n");
        properties.setStartAtEnd(true);

        assertThat(newTailer().poll()).isZero();
        assertThat(publisher.sent).isEmpty();

        append(file, "brand new\n");
        assertThat(newTailer().poll()).isEqualTo(1);
        assertThat(publisher.linesFor("LAB001")).containsExactly("brand new");
    }

    @Test
    @DisplayName("A charger directory that appears later is picked up")
    void newChargersArePickedUp() throws Exception {
        append(logFor("LAB001"), "first charger\n");
        LogTailService tailer = newTailer();
        assertThat(tailer.poll()).isEqualTo(1);

        append(logFor("LAB009"), "new charger\n");
        publisher.clear();

        assertThat(tailer.poll()).isEqualTo(1);
        assertThat(publisher.linesFor("LAB009")).containsExactly("new charger");
    }

    @Test
    @DisplayName("A line longer than the read budget is dropped whole, never shipped in pieces")
    void overlongLineIsDroppedWhole() throws Exception {
        properties.setMaxBytesPerPoll(64);
        Path file = logFor("LAB001");
        append(file, "short\n" + "x".repeat(200) + "\nafter\n");

        LogTailService tailer = newTailer();
        for (int i = 0; i < 5; i++) {
            tailer.poll();
        }

        // Before the fix the tail of the long line was published as if it were a line of its own.
        assertThat(publisher.linesFor("LAB001")).containsExactly("short", "after");
    }

    @Test
    @DisplayName("An over-long line still being written waits, then is skipped once complete")
    void unterminatedOverlongLineWaits() throws Exception {
        properties.setMaxBytesPerPoll(64);
        Path file = logFor("LAB001");
        append(file, "x".repeat(200));

        LogTailService tailer = newTailer();
        assertThat(tailer.poll()).isZero();

        append(file, "y".repeat(50) + "\nnext\n");
        for (int i = 0; i < 3; i++) {
            tailer.poll();
        }

        assertThat(publisher.linesFor("LAB001")).containsExactly("next");
    }

    @Test
    @DisplayName("Start-at-end begins at a line boundary, so a line being written is shipped whole")
    void startAtEndBeginsAtALineBoundary() throws Exception {
        properties.setStartAtEnd(true);
        Path file = logFor("LAB001");
        append(file, "historic\npartial");

        LogTailService tailer = newTailer();
        assertThat(tailer.poll()).isZero();

        append(file, " line\n");
        tailer.poll();

        assertThat(publisher.linesFor("LAB001")).containsExactly("partial line");
    }

    @Test
    @DisplayName("A directory whose name is not a safe charger id is not shipped")
    void unsafeDirectoryNamesAreSkipped() throws Exception {
        append(logFor("LAB001"), "good\n");
        Path bad = Files.createDirectories(root.resolve("BAD ID"));
        append(bad.resolve("2026-09-21_BAD ID.txt"), "forged\n");

        newTailer().poll();

        assertThat(publisher.sent).extracting(RecordingPublisher.Published::chargerId)
                .containsOnly("LAB001");
    }
}
