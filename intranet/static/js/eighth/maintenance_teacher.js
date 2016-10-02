function refreshList() {
    $("#teacher-list .teacher").remove();
    $.get(list_endpoint, function(data) {
        var tdata = data.teachers;
        $.each(tdata, function(k, v) {
            $("#teacher-list").append("<div class=\"teacher\" data-id=\"" + v.id + "\">" + v.name  + "</div>");
        });
    });
}
function loadTeacher(id) {
    $("#delete-teacher").toggle(!!id);
    $("#generate-id").toggle(!id);
    $("#create-notif").toggle(!!id);
    $("#ldap-iodineUidNumber, #ldap-iodineUid").prop("readonly", !!id);
    $("#edit-teacher").text(id ? "Edit Teacher" : "Create Teacher");
    $("#edit-title").text(id ? "Edit Teacher Account - " + id : "Create Teacher Account");
    $(".ldap-field").val("");
    $(".ldap-field").attr("data-original", "");
    if (id) {
        $("#ldap-loading").show();
        $.get(list_endpoint + "?id=" + encodeURIComponent(id), function(data) {
            $.each(data.teacher, function(k, v) {
                var ele = $("#ldap-" + k + ".ldap-field");
                if (ele) {
                    ele.val(v);
                    ele.attr("data-original", v);
                }
            });
        }).fail(function() {
            Messenger().error("Failed to retrieve account information.");
        }).always(function() {
            $("#ldap-loading").hide();
        });
    }
}
$(document).ready(function() {
    refreshList();
    $(window).resize(function() {
        $("#teacher-list").css("height", ($(window).height() - $("#teacher-list").offset().top - 10) + "px");
    });
    $(window).resize();
    $("#teacher-list-search").on("change keyup paste", function() {
        var term = $(this).val().toLowerCase();
        $("#teacher-list .teacher").each(function() {
            var contains = $(this).text().toLowerCase().indexOf(term) !== -1;
            var idcontains = $(this).data("id").toLowerCase().indexOf(term) !== -1;
            $(this).toggle(contains || idcontains);
        });
    });
    $("#teacher-list").keydown(function(e) {
        var ele = null;
        if (e.which === 38) {
            ele = $(".teacher.selected").prev();
        }
        else if (e.which === 40) {
            ele = $(".teacher.selected").next();
        }
        if (ele && !ele.hasClass("selected")) {
            ele.click();
            var $tl = $("#teacher-list");
            $tl.scrollTop($tl.scrollTop() + ele.position().top - $tl.height()/2 + ele.height()/2);
            e.preventDefault();
        }
    });
    $("#teacher-list").on("click", ".teacher", function() {
        if ($(this).hasClass("selected")) {
            $(this).removeClass("selected");
            loadTeacher(false);
        }
        else {
            $(".teacher").removeClass("selected");
            $(this).addClass("selected");
            loadTeacher($(this).data("id"));
            $("#teacher-list").focus();
        }
    });
    $("#edit-teacher").click(function(e) {
        e.preventDefault();
        var fields = {};
        $(".ldap-field").each(function() {
            fields[$(this).attr("id").substring(5)] = $(this).val();
        });
        $.post(modify_endpoint, fields, function(data) {
            if (data.success) {
                Messenger().success("Teacher account '" + data.id + "' created/modified!");
                loadTeacher(data.id);
                refreshList();
            }
            else {
                Messenger().error("Failed to modify/create account." + (data.error ? "<br /><b>Error:</b> " + data.error : "") + (data.details ? "<br /><b>Details</b>: " + data.details : ""));
            }
        });
    });
    $("#generate-id").click(function(e) {
        e.preventDefault();
        $.get(next_id_endpoint, function(data) {
            $("#ldap-iodineUidNumber").val(data.id);
        });
    });
    $("#delete-teacher").click(function(e) {
        e.preventDefault();
        if (confirm("Are you sure you want to delete '" + $("#ldap-cn").data("original") + "'?\nThis action is irreversible!")) {
            $.post(delete_endpoint, { "dn": $("#ldap-dn").val() }, function(data) {
                if (data.success) {
                    Messenger().success("Teacher account '" + $("#ldap-cn").data("original") + "' deleted!");
                    loadTeacher(false);
                    refreshList();
                }
                else {
                    Messenger().error("Failed to delete teacher account." + (data.error ? "<br /><b>Error:</b> " + data.error : "") + (data.details ? "<br /><b>Details</b>: " + data.details : ""));
                }
            });
        }
    });
});
