var cur_section = -1;
var section_heights = [];
var animation_running = false;
var original_text = [];
var touch_start;

const ROTOR_CONFIGURATIONS = {
    "I": "EKMFLGDQVZNTOWYHXUSPAIBRCJ-R",
    "II": "AJDKSIRUXBLHWTMCQGZNPYFVOE-F",
    "III": "BDFHJLCPRTXVZNYEIWGAKMUSQO-W",
    "IV": "ESOVPZJAYQUIRHXLNFTGKDCMWB-K",
    "V": "VZBRGITYUPSDNHLXAWMJQOFECK-A",
    // REFLECTORS
    "B": "YRUHQSLDPXNGOKMIEBFZCWVJAT",
    "C": "FVPJIAOYEDRZXWGCTKUQSBNMHL"
}
var plugboard_interchanges = ["A/L", "P/R", "T/D", "B/W", "K/F", "O/Y"]; // TODO: unhardcode
var wheels = [
    initWheel(ROTOR_CONFIGURATIONS["B"]),
    initWheel(ROTOR_CONFIGURATIONS["III"], "D"),
    initWheel(ROTOR_CONFIGURATIONS["I"], "B"),
    initWheel(ROTOR_CONFIGURATIONS["II"], "P")
]; // TODO: unhardcode

function initWheel(configuration, starting_position="A") {
    var wheel = {
        "translation": [],
        "position": "A",
        "notch": configuration.charAt(27),
        "reflector": configuration.charAt(26) != "-"
    };
    for (var i = 0; i < 26; i++) {
        wheel["translation"].push(configuration.charAt(i).charCodeAt() - "A".charCodeAt());
    }
    for (var i = 0; i < starting_position.charCodeAt() - "A".charCodeAt(); i++) {
        spinWheel(wheel);
    }
    return wheel;
}

function spinWheel(wheel) {
    wheel["translation"].unshift(wheel["translation"].pop());
    wheel["position"] = String.fromCharCode((wheel["position"].charCodeAt() - "A".charCodeAt() + 1) % 26 + "A".charCodeAt());
    return wheel;
}

function advanceWheels() {
    if (spinWheel(wheels[3])["position"] == wheels[3]["notch"]) {
        if (spinWheel(wheels[2])["position"] == wheels[2]["notch"]) {
            spinWheel(wheels[1]);
        }
    }
}

function plugboardTranslation(char) {
    for (var interchange of plugboard_interchanges) {
        if (char == interchange.charAt(0)) {
            return interchange.charAt(2);
        } else if (char == interchange.charAt(2)) {
            return interchange.charAt(0);
        }
    }
    return char;
}

function wheelTranslation(wheel, axial, forward) {
    if (forward) {
        return wheels[wheel]["translation"][axial];
    } else {
        return wheels[wheel]["translation"].indexOf(axial);
    }
}

function encryptChar(char) {
    advanceWheels();
    if (!char.match(/[a-zA-Z]/)) {
        return char
    } else {
        return plugboardTranslation(
            String.fromCharCode(
                wheelTranslation(3,
                    wheelTranslation(2,
                        wheelTranslation(1,
                            wheelTranslation(0,
                                wheelTranslation(1,
                                    wheelTranslation(2,
                                        wheelTranslation(3,
                                            plugboardTranslation(char.toUpperCase()).charCodeAt() - "A".charCodeAt(),
                                        true),
                                    true),
                                true),
                            true),
                        false),
                    false),
                false) % 26 + "A".charCodeAt()
            )
        )
    }
}

function encryptSection(section) {
    $("section." + section + " key").each(function(i) {
        $(this).text(encryptChar(original_text[section]["heading-keys"].charAt(i)));
    })
    subheading_tag = original_text[section]["subheading-tag"]
    for (var i = 0; i < subheading_tag.length; i++) {
        var c = encryptChar(subheading_tag.charAt(i))
        subheading_tag = subheading_tag.substring(0, i) + c + subheading_tag.substring(i + 1);
        $("section." + section + " subheading:not(.timeframe) > strong").text(subheading_tag);
    }
    subheading_text = original_text[section]["subheading-text"]
    for (var i = 0; i < subheading_text.length; i++) {
        subheading_text = subheading_text.substring(0, i) + encryptChar(subheading_text.charAt(i)) + subheading_text.substring(i + 1);
        $("section." + section + " subheading:not(.timeframe) > text").text(subheading_text);
    }
    subheading_timeframe = original_text[section]["subheading-timeframe"]
    for (var i = 0; i < subheading_timeframe.length; i++) {
        subheading_timeframe = subheading_timeframe.substring(0, i) + encryptChar(subheading_timeframe.charAt(i)) + subheading_timeframe.substring(i + 1);
        $("section." + section + " subheading.timeframe").text(subheading_timeframe);
    }
    blurb = original_text[section]["blurb"]
    for (var i = 0; i < blurb.length; i++) {
        blurb = blurb.substring(0, i) + encryptChar(blurb.charAt(i)) + blurb.substring(i + 1);
        $("section." + section + " blurb").text(blurb);
    }
}

function decryptSection(section) {
    $("section." + section + " heading key").each(function(i) {
        $(this).text(original_text[section]["heading-keys"].charAt(i));
    })
    subheading_tag = original_text[section]["subheading-tag"]
    $("section." + section + " subheading:not(.timeframe) > strong").text(subheading_tag);
    subheading_text = original_text[section]["subheading-text"]
    $("section." + section + " subheading:not(.timeframe) > text").text(subheading_text);
    subheading_timeframe = original_text[section]["subheading-timeframe"]
    $("section." + section + " subheading.timeframe").text(subheading_timeframe);
    blurb = original_text[section]["blurb"]
    $("section." + section + " blurb").text(blurb);
}

function alignSections() {
    $("header-spacer").height(parseFloat($("header").height()) + parseFloat($("header").css("padding-top")) + parseFloat($("header").css("padding-bottom")));
    $("plug-board").css("top", parseFloat($("header").height()) + parseFloat($("header").css("padding-bottom")) + 2);
    $("plug-board").css("left", parseFloat($("section.0").css("margin-left")) + (parseFloat($("border").css("width")) === 0.0 ? parseFloat($("content").css("margin-left")) : parseFloat($("border").css("width"))) - 16);
    section_heights = [75];
    for (var i = 0; i < parseInt($("section-container").attr("class")); i++) {
        section_heights.push($("section." + i).height() + 2*parseInt($("section." + i).css("padding")) + parseInt($("section." + i).css("margin-top")) + (section_heights.length > 0 ? section_heights[section_heights.length-1] : 0));
        $("section." + i + " > wires").height($("section." + i).height() + 40);
        $("section." + i + " > sample-box > code").css("max-height", $("section." + i + " > section-content").height() - ($("section." + i + " > sample-box > frame-indicator-container").length ? 45 : 0));
    }
}

function borderScroll(e) {
    e.preventDefault();
}

function contentScroll(e) {
    var delta;
    if (window.TouchEvent && e.originalEvent instanceof TouchEvent) {
        delta = e.originalEvent.touches[0].pageY;
        if (delta < touch_start) {
            delta *= -1;
        }
    } else {
        delta = e.originalEvent.deltaY;
    }

    if ((window.TouchEvent && e.originalEvent instanceof TouchEvent) || !$("sample-box:hover").length) {
        e.preventDefault();
        if (delta > 0 && !animation_running) { // scroll up
            if (cur_section > 0) {
                encryptSection(cur_section);
                cur_section -= 1;
                animation_running = true;
                $("content").animate({
                    scrollTop: section_heights[cur_section] - 21
                }, 0, function() {
                    setTimeout(function() {
                        setTimeout(function() {
                            animation_running = false;
                        }, 500);
                        decryptSection(cur_section);
                    }, 500);
                })
            }
        } else if (delta < 0 && !animation_running) { // scroll down
            if (cur_section < parseInt($("content > section-container").attr("class")) - 1) {
                if (cur_section >= 0) {
                    encryptSection(cur_section);
                }
                cur_section += 1;
                animation_running = true;
                $("content").animate({
                    scrollTop: section_heights[cur_section] - 21
                }, 0, function() {
                    setTimeout(function() {
                        setTimeout(function() {
                            animation_running = false;
                        }, 500);
                        decryptSection(cur_section);
                    }, 500);
                })
            }
        }
    }
}

$(document).ready(function() {
    // prepare samples
    $("frame-indicator.1").addClass("active");
    $("sample-box > code:not(.1), sample-box > img:not(.1)").hide();
    // encryption
    for (var i = 0; i < parseInt($("section-container").attr("class")); i++) {
        var heading_keys = "";
        $("section." + i + " heading key").each(function() {
            heading_keys += $(this).text();
        })
        var subheading_tag = $("section." + i + " subheading:not(.timeframe) > strong").text();
        var subheading_text = $("section." + i + " subheading:not(.timeframe) > text").text();
        var subheading_timeframe = $("section." + i + " subheading.timeframe").text();
        var blurb = $("section." + i + " blurb").text();

        original_text.push({
            "heading-keys": heading_keys,
            "subheading-tag": subheading_tag,
            "subheading-text": subheading_text,
            "subheading-timeframe": subheading_timeframe,
            "blurb": blurb,
        });

        encryptSection(i);
    }
    // configure section scrolling
    $("header, border").bind("wheel", borderScroll);
    $("header, border").bind("touchmove", borderScroll);
    $("content").bind("wheel", contentScroll);
    $("content").bind("touchstart", function(e) {touch_start = e.originalEvent.touches[0].clientY;})
    $("content").bind("touchmove", contentScroll);
    $("sample-box > frame-indicator-container").click(function() {
        var next = false;
        $(this).children().children().each(function() {
            if ($(this).hasClass("active")) {
                $(this).removeClass("active");
                $(this).parent().parent().parent().children().filter("." + $(this).attr("class")).toggle();
                next = true;
            } else if (next) {
                $(this).parent().parent().parent().children().filter("." + $(this).attr("class")).toggle();
                $(this).addClass("active");
                next = false;
            }
        })
        if (next) {
            $(this).parent().children().filter(".1").toggle();
            $(this).children().children().filter(".1").addClass("active");
            next = false;
        }
    });
    $("key").click(function() {
        console.log(encryptChar($(this).text()));
    })

    alignSections();
    alignSections();
});

$(window).resize(alignSections);