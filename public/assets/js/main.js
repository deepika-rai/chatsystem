(function ($) {
    'use strict';

    window.prettyPrint && prettyPrint();
    $(window).on('load', function () {
        $('.chat-scroll').scrollTop(1000);
    });

    $(document).ready(function () {

        // Toggle Header Navigation Position
        $('#navChange').on('click', function () {
            if ($('.header').hasClass('horizontal-nav')) {
                $('body').removeClass('active');
                $('#navChange .bi').removeClass('bi-arrow-bar-left').addClass('bi-arrow-bar-up');
                $('.header').removeClass('horizontal-nav');
                $('.header .logo').removeClass('no-sidebar-logo');
                $('.fixed-sidebar').removeClass('hide');
                $('.sidebar-collapse, .sidebar-collapse-mini').fadeIn(300);
                $('.main-content').removeClass('no-sidebar');
            } else {
                $('body').addClass('active');
                $('#navChange .bi').addClass('bi-arrow-bar-left').removeClass('bi-arrow-bar-up');
                $('.header').addClass('horizontal-nav');
                $('.header .logo').addClass('no-sidebar-logo');
                $('.fixed-sidebar').addClass('hide');
                $('.sidebar-collapse, .sidebar-collapse-mini').fadeOut(300);
                $('.main-content').addClass('no-sidebar');
            }
        });

        // Highlight active horizontal menu link
        $(".horizontal-menu li a").each(function () {
            const pageUrl = window.location.href.split(/[?#]/)[0];
            if (this.href === pageUrl) {
                $(this).addClass("active");
            }
        });

        // Sidebar Collapse (Desktop & Mobile)
        $('.sidebar-collapse, .sidebar-collapse-mini').on('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            var w = $(window).width();
            if (w > 1299) {
                // XL+: icon-only collapse
                $('.header .logo').toggleClass('small');
                $('.fixed-sidebar').toggleClass('collapsed');
                $('.main-content').toggleClass('expanded');
            } else if (w > 992) {
                // LG: sidebar is fixed — button not shown via CSS, no-op
            } else {
                // MD and below: off-canvas drawer
                var isOpen = !$('.fixed-sidebar').hasClass('sidebar-mini');
                if (isOpen) {
                    $('.fixed-sidebar').addClass('sidebar-mini');
                    $('#sidebarOverlay').removeClass('active');
                } else {
                    $('.fixed-sidebar').removeClass('sidebar-mini');
                    $('#sidebarOverlay').addClass('active');
                }
                $('.fixed-sidebar').removeClass('collapsed');
            }
        });

        // Close sidebar when overlay is clicked (mobile only)
        $('#sidebarOverlay').on('click', function () {
            $('.fixed-sidebar').addClass('sidebar-mini');
            $(this).removeClass('active');
        });

        // Hover Effect on Sidebar (desktop collapse expand preview)
        $('.fixed-sidebar').hover(function () {
            if ($(window).width() > 1299) {
                $(this).removeClass('collapsed');
                $('.header .logo').removeClass('small');
                $('.main-content').removeClass('expanded');
            }
        });

        // Sidebar Dropdown Logic
        $('.sub-menu').hide(); // Hide all by default

        $('.has-sub > a').on('click', function (e) {
            e.preventDefault(); // Prevent default link

            const $parent = $(this).parent();

            if ($parent.hasClass('open')) {
                $parent.removeClass('open').children('.sub-menu').stop().slideUp();
            } else {
                $('.has-sub').removeClass('open').children('.sub-menu').stop().slideUp();
                $parent.addClass('open').children('.sub-menu').stop().slideDown();
            }
        });

        // Auto-highlight and open active sidebar menu
        $(".fixed-sidebar li a").each(function () {
            const pageUrl = window.location.href.split(/[?#]/)[0];
            if (this.href === pageUrl) {
                $(this).addClass("active");

                const $parentSub = $(this).closest(".sub-menu");
                const $parentLi = $(this).closest(".has-sub");

                if ($parentSub.length && $parentLi.length) {
                    $parentLi.addClass("open");
                    $parentSub.show();
                }
            }
        });

        // Sidebar Profile Close
        $('#profileClose').on('click', function () {
            $('.sidebar-profile').hide(500);
        });

        // Bootstrap Tooltip Activation
        var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
    });

}(jQuery));
