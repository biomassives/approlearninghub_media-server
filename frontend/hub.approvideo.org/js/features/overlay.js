// js/features/overlay.js

/**
 * Approvideo Welcome Overlay
 * Dynamically creates and manages the role selection overlay.
 */


const ApprovideoOverlay = (() => {
    // --- Configuration (Update these paths and text) ---
    const config = {
        mainIllustration: "path/to/your/main-uplifting-illustration.svg", // e.g., ./assets/images/overlay-main-graphic.svg
        roles: [
            {
                id: "community-member",
                name: "Community Member", // Replace with actual text like "ЯคคɭՇ๏ยг โร๓єรฬเ๓g"
                illustration: "path/to/your/role-character-1.svg", // e.g., ./assets/images/role-community.svg
                altText: "Community Member Illustration"
            },
            {
                id: "project-proposer",
                name: "Project Proposer", // Replace with actual text like "Sร๔кєร Hย๓๏ยรɭɭ๏๓єภՇ"
                illustration: "path/to/your/role-character-2.svg", // e.g., ./assets/images/role-proposer.svg
                altText: "Project Proposer Illustration"
            },
            {
                id: "facilitator-expert",
                name: "Facilitator/Expert", // Replace with actual text like "Jร๏๔๏รєรђ Iєק๏รภՇ"
                illustration: "path/to/your/role-character-3.svg", // e.g., ./assets/images/role-expert.svg
                altText: "Facilitator/Expert Illustration"
            }
            // Add more roles as needed from your mockup
        ],
        // Text content (replace with your actual text from the mockup)
        title: "Choose Your Role",
        introParagraph: "Sรณค๓є Շค๒lєรђ๏๏Շєг ร๏ŦՇฬคгє Շ๏ ฬ๏гкร α๒๓єՇץ๏ยг г๏lєร (Your introductory text here)",
        guidanceText: "Wєlς๏๓є ร๏๓єՇรค๓є ร๏єгlคภ๔รภєς๏ש๏гรเภє ค๏lคเՇ.gєՇ ץ๏ยг ค๏гคՇร๏ร ย̈รєгร lเкє ђє νε νεvarsigmaรเภคՇ๏г คภ๔ єєςՇгยςєєՇ єг ๏ภเՇєє νεvarsigmaคгภєรςг๏ є๏ςเՇเภє Շгเ๏ɭ๏เ๏. Ŧยภ๔ค๓єภՇร เŦเς๏ รєгครє เภภ๏ςץ ยรค๓є เгคש๏г є ย๏гєl๏к. ย̈ภฬ๏ภɭՇคภ שєгรฬєɭɭเɭคՇ ợเlร๏к ครгเՇгค̊ภรợ ค๔๏๏ץՇєгг๏г๔เ๏เɭเภץ ́๏เ๏ภ Շєเɭร. (Your detailed explanation text here)",
        primaryButtonText: "ĐẰŞत्री Ęů Řůįň (Confirm)",
        secondaryButtonText: "ĞĪVI P (Skip)",
        footerLinkText: "ՈՍՍՆՏ৮ ᗰᗩᑎ Єɭ๏ҡคשє. Bєɭَاňҡร אكُمْภเ๔ (Learn More)"
    };

    let overlayElement = null;
    let selectedRole = null;




    // --- HTML Structure ---

    function createOverlayHTML() {
        const rolesHTML = config.roles.map(role => `
            <div class="role-option-card" data-role="${role.id}" tabindex="0" aria-label="Select role: ${role.name}">
                <img src="${role.illustration}" alt="${role.altText}" class="role-character-illustration">
                <span class="role-name-text">${role.name}</span>
            </div>
        `).join('');

        return `
            <div class="welcome-overlay-approvideo" id="roleSelectionOverlay" aria-modal="true" role="dialog" aria-labelledby="overlayTitle">
                <div class="overlay-content-approvideo">
                    <div class="overlay-header-approvideo">
                        <h1 id="overlayTitle">${config.title}</h1>
                        <p>${config.introParagraph}</p>
                    </div>

                    <div class="overlay-main-content-approvideo">
                        <div class="main-illustration-container">
                            <img src="${config.mainIllustration}" alt="Approvideo Community Illustration">
                        </div>
                        <div class="role-selection-area-approvideo">
                            <p class="role-guidance-text">${config.guidanceText}</p>
                            <div class="role-options-approvideo">
                                ${rolesHTML}
                            </div>
                        </div>
                    </div>

                    <div class="overlay-actions-approvideo">
                        <button class="button-primary-approvideo" id="confirmRoleButton">${config.primaryButtonText}</button>
                        <button class="button-secondary-approvideo" id="skipRoleButton">${config.secondaryButtonText}</button>
                    </div>
                    <p class="footer-link-approvideo"><a href="#" id="learnMoreLink">${config.footerLinkText}</a></p>
                </div>
            </div>
        `;
    }





    // --- CSS Styles ---

    function getOverlayCSS() {
        // Minimized CSS for brevity. Expand with styles from your mockup.
        // Consider moving this to a separate CSS file for larger projects.
        return `
            .welcome-overlay-approvideo {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.5); /* Semi-transparent background */
                display: none; /* Hidden by default */
                justify-content: center;
                align-items: center;
                z-index: 1000;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                opacity: 0;
                transition: opacity 0.3s ease-in-out;
            }
            .welcome-overlay-approvideo.visible {
                display: flex;
                opacity: 1;
            }
            .overlay-content-approvideo {
                background-color: #fff;
                padding: 30px 40px;
                border-radius: 12px; /* Rounded corners like mockup */
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
                width: 90%;
                max-width: 900px; /* Adjust as needed */
                text-align: center;
                position: relative;
                display: flex;
                flex-direction: column;
            }
            .overlay-header-approvideo h1 {
                font-size: 28px; /* Adjust as per mockup */
                color: #333;
                margin-bottom: 10px;
            }
            .overlay-header-approvideo p {
                font-size: 16px;
                color: #666;
                line-height: 1.5;
                margin-bottom: 20px;
            }
            .overlay-main-content-approvideo {
                display: flex;
                align-items: center; /* Vertically align illustration and roles */
                gap: 30px; /* Space between illustration and roles */
                margin-bottom: 30px;
            }
            .main-illustration-container {
                flex: 1; /* Adjust flex ratio as needed */
                max-width: 40%; /* Limit illustration size */
            }
            .main-illustration-container img {
                max-width: 100%;
                height: auto;
                border-radius: 8px; /* If illustration itself has a background */
            }
            .role-selection-area-approvideo {
                flex: 1.5; /* Adjust flex ratio */
                text-align: left;
            }
            .role-guidance-text {
                font-size: 14px;
                color: #555;
                margin-bottom: 20px;
            }
            .role-options-approvideo {
                display: flex;
                flex-direction: column; /* Stack role options vertically */
                gap: 15px; /* Space between role cards */
            }
            .role-option-card {
                display: flex;
                align-items: center;
                padding: 10px 15px;
                border: 1px solid #e0e0e0;
                border-radius: 8px;
                cursor: pointer;
                transition: background-color 0.2s ease, border-color 0.2s ease;
            }
            .role-option-card:hover, .role-option-card:focus {
                background-color: #f0f8ff; /* Light blue hover, adjust to mockup */
                border-color: #007bff; /* Blue border on hover, adjust */
                outline: none;
            }
            .role-option-card.selected {
                background-color: #e6f3ff; /* Slightly darker blue for selected */
                border-color: #0056b3;
                box-shadow: 0 0 0 2px #007bff; /* Selection ring */
            }
            .role-character-illustration {
                width: 40px; /* Adjust size as per mockup */
                height: 40px;
                margin-right: 15px;
                object-fit: contain;
            }
            .role-name-text {
                font-size: 16px;
                color: #333;
            }
            .overlay-actions-approvideo {
                display: flex;
                justify-content: center; /* Center buttons */
                gap: 15px; /* Space between buttons */
                margin-top: 20px;
                margin-bottom: 15px;
            }
            .button-primary-approvideo, .button-secondary-approvideo {
                padding: 12px 25px;
                border: none;
                border-radius: 25px; /* Pill-shaped buttons like mockup */
                font-size: 16px;
                font-weight: bold;
                cursor: pointer;
                transition: background-color 0.2s ease, transform 0.1s ease;
            }
            .button-primary-approvideo {
                background-color: #007bff; /* Blue color from mockup */
                color: white;
            }
            .button-primary-approvideo:hover {
                background-color: #0056b3;
            }
            .button-secondary-approvideo {
                background-color: #6c757d; /* Darker button color from mockup */
                color: white;
            }
            .button-secondary-approvideo:hover {
                background-color: #5a6268;
            }
            .button-primary-approvideo:active, .button-secondary-approvideo:active {
                transform: scale(0.98);
            }
            .footer-link-approvideo {
                font-size: 14px;
                text-align: center;
            }
            .footer-link-approvideo a {
                color: #007bff; /* Blue link color */
                text-decoration: none;
            }
            .footer-link-approvideo a:hover {
                text-decoration: underline;
            }

            /* Responsive adjustments */
            @media (max-width: 768px) {
                .overlay-content-approvideo {
                    padding: 20px;
                    max-height: 95vh;
                    overflow-y: auto;
                }
                .overlay-main-content-approvideo {
                    flex-direction: column;
                    text-align: center;
                }
                .main-illustration-container {
                    max-width: 60%;
                    margin-bottom: 20px;
                }
                .role-selection-area-approvideo {
                    text-align: center;
                }
                .role-options-approvideo {
                    align-items: center; /* Center role cards on mobile */
                }
                .role-option-card {
                    width: 100%;
                    max-width: 350px; /* Max width for role cards on mobile */
                    justify-content: flex-start; /* Align items to start */
                }
                 .overlay-actions-approvideo {
                    flex-direction: column;
                }
                .button-primary-approvideo, .button-secondary-approvideo {
                    width: 100%;
                    max-width: 300px; /* Max width for buttons on mobile */
                    margin-left: auto;
                    margin-right: auto;
                }
            }
        `;
    }

    // --- Event Handlers ---
    function handleRoleCardClick(event) {
        const selectedCard = event.currentTarget;
        selectedRole = selectedCard.dataset.role;

        // Remove 'selected' class from all cards
        overlayElement.querySelectorAll('.role-option-card').forEach(card => {
            card.classList.remove('selected');
            card.setAttribute('aria-checked', 'false');
        });

        // Add 'selected' class to the clicked card
        selectedCard.classList.add('selected');
        selectedCard.setAttribute('aria-checked', 'true');
        console.log("Role selected:", selectedRole);
    }

    function handleConfirmRole() {
        if (selectedRole) {
            console.log("Confirming role:", selectedRole);
            // TODO: Add logic to save the role (e.g., localStorage, API call)
            // localStorage.setItem('userRole', selectedRole);
            // localStorage.setItem('roleSelected', 'true');
            alert(`Role confirmed: ${selectedRole}. Implement further action.`);
            hide();
        } else {
            alert("Please select a role first.");
            // Optionally, highlight the role selection area or provide a more subtle message
        }
    }

    function handleSkipRole() {
        console.log("Role selection skipped.");
        // TODO: Add logic for skipping (e.g., set a session flag)
        // sessionStorage.setItem('overlaySkipped', 'true');
        alert("Role selection skipped. Implement further action.");
        hide();
    }

    function handleLearnMore(event) {
        event.preventDefault();
        console.log("Learn more clicked.");
        alert("Implement 'Learn More' functionality or link.");
        // window.open('your-learn-more-url.html', '_blank');
    }

    // --- Public API ---
    function init() {
        if (document.getElementById('roleSelectionOverlay')) {
            return; // Already initialized
        }

        // Inject CSS
        const styleTag = document.createElement('style');
        styleTag.id = 'approvideoOverlayStyles';
        styleTag.textContent = getOverlayCSS();
        document.head.appendChild(styleTag);

        // Create and inject HTML
        const overlayContainer = document.createElement('div');
        overlayContainer.innerHTML = createOverlayHTML();
        overlayElement = overlayContainer.firstChild;
        document.body.appendChild(overlayElement);

        // Add event listeners
        overlayElement.querySelectorAll('.role-option-card').forEach(card => {
            card.addEventListener('click', handleRoleCardClick);
            card.addEventListener('keydown', (e) => { // Keyboard accessibility
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleRoleCardClick(e);
                }
            });
        });
        overlayElement.querySelector('#confirmRoleButton').addEventListener('click', handleConfirmRole);
        overlayElement.querySelector('#skipRoleButton').addEventListener('click', handleSkipRole);
        overlayElement.querySelector('#learnMoreLink').addEventListener('click', handleLearnMore);

        // Close with Escape key
        document.addEventListener('keydown', (event) => {
            if (event.key === "Escape" && overlayElement.classList.contains('visible')) {
                hide();
            }
        });
    }

    function show() {
        if (!overlayElement) {
            console.error("Overlay not initialized. Call ApprovideoOverlay.init() first.");
            return;
        }
        // Optional: Logic to show only if role not selected/skipped
        // if (localStorage.getItem('roleSelected') || sessionStorage.getItem('overlaySkipped')) {
        //     return;
        // }
        overlayElement.classList.add('visible');
        // Focus management for accessibility
        overlayElement.querySelector('.role-option-card, button, a')?.focus();
    }

    function hide() {
        if (!overlayElement) return;
        overlayElement.classList.remove('visible');
    }

    // --- Expose Public Methods ---
    return {
        init,
        show,
        hide,
        setConfig: (newConfig) => { // Allow overriding default config before init
            Object.assign(config, newConfig);
        }
    };
})();

// --- Example Usage (Typically in your main app.js or on page load) ---
// document.addEventListener('DOMContentLoaded', () => {
//     ApprovideoOverlay.init();
//
//     // Example: Show overlay if no role is stored
//     if (!localStorage.getItem('userRole') && !sessionStorage.getItem('overlaySkippedThisSession')) {
//          ApprovideoOverlay.show();
//     }
// });

A
A
A
A
A
A
A
A
A
A
A
A
A
A
A
A
A

