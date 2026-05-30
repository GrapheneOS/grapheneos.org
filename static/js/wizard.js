document.addEventListener('DOMContentLoaded', () => {
    const mainContainer = document.getElementById('web-install');
    const toggleBtn = document.getElementById('toggle-wizard-btn');
    
    let currentStep = 1;
    const totalSteps = 6;

    // Mode toggling 
    toggleBtn.addEventListener('click', () => {
        if (mainContainer.classList.contains('classic-mode')) {
            mainContainer.classList.replace('classic-mode', 'wizard-mode');
            toggleBtn.innerText = "Switch to Full Technical Guide (Classic Mode)";
            updateWizardUI();
            moveInteractiveElements('wizard');
        } else {
            mainContainer.classList.replace('wizard-mode', 'classic-mode');
            toggleBtn.innerText = "Enable Guided Wizard (Easy Mode)";
            moveInteractiveElements('classic');
        }
    });

    // Move functional installer buttons so IDs don't duplicate and break web-install.js
    function moveInteractiveElements(targetMode) {
        // Define the IDs of the buttons/status containers 
        const elementsToMove = [
            { elId: 'unlock-bootloader-button', classicParent: 'classic-unlock-container', wizardParent: 'wizard-unlock-container' },
            { elId: 'unlock-bootloader-status', classicParent: 'classic-unlock-container', wizardParent: 'wizard-unlock-container' },
            
            { elId: 'download-release-button', classicParent: 'classic-download-container', wizardParent: 'wizard-download-container' },
            { elId: 'download-release-status-container', classicParent: 'classic-download-container', wizardParent: 'wizard-download-container' },
            
            { elId: 'flash-release-button', classicParent: 'classic-flash-container', wizardParent: 'wizard-flash-container' },
            { elId: 'flash-release-status-container', classicParent: 'classic-flash-container', wizardParent: 'wizard-flash-container' },
            
            { elId: 'lock-bootloader-button', classicParent: 'classic-lock-container', wizardParent: 'wizard-lock-container' },
            { elId: 'lock-bootloader-status', classicParent: 'classic-lock-container', wizardParent: 'wizard-lock-container' }
        ];

        elementsToMove.forEach(item => {
            const el = document.getElementById(item.elId);
            if (!el) return; // Skip if it doesn't exist

            const targetParent = document.getElementById(targetMode === 'wizard' ? item.wizardParent : item.classicParent);
            if (targetParent) {
                targetParent.appendChild(el);
            }
        });
    }

    // Wizard navigation logic
    const updateWizardUI = () => {
        // Update cards
        document.querySelectorAll('.wizard-card').forEach(card => {
            if (parseInt(card.getAttribute('data-step')) === currentStep) {
                card.classList.add('active');
            } else {
                card.classList.remove('active');
            }
        });

        // Update breadcrumbs
        document.querySelectorAll('.wizard-breadcrumbs li').forEach(crumb => {
            const stepNum = parseInt(crumb.getAttribute('data-step'));
            crumb.classList.remove('active', 'completed');
            if (stepNum === currentStep) {
                crumb.classList.add('active');
            } else if (stepNum < currentStep) {
                crumb.classList.add('completed');
            }
        });
    };

    // Next button listeners
    document.querySelectorAll('.next-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if (currentStep < totalSteps) {
                currentStep++;
                updateWizardUI();
            }
        });
    });

    // Previous button listeners
    document.querySelectorAll('.prev-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if (currentStep > 1) {
                currentStep--;
                updateWizardUI();
            }
        });
    });
    
    // Finish button listener
    document.querySelector('.finish-btn')?.addEventListener('click', () => {
        alert("Installation flow complete. You can now toggle back to the classic mode to read Post-Installation verify steps.");
    });

    // Step 1 checklist validation
    const checkboxes = document.querySelectorAll('.prereq-trigger');
    const step1NextBtn = document.querySelector('.wizard-card[data-step="1"] .next-btn');

    checkboxes.forEach(box => {
        box.addEventListener('change', () => {
            const checkedCount = document.querySelectorAll('.prereq-trigger:checked').length;
            step1NextBtn.disabled = (checkedCount !== checkboxes.length);
        });
    });
});