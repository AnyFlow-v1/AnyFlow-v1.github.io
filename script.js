document.addEventListener('DOMContentLoaded', function () {
    if (location.protocol === 'file:') {
        const w = document.getElementById('local-file-warning');
        if (w) {
            w.hidden = false;
        }
    }

    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start',
                });
            }
        });
    });

    const dropdownTriggers = document.querySelectorAll('.navbar-item.has-dropdown .navbar-link');
    const dropdownParents = document.querySelectorAll('.navbar-item.has-dropdown');
    const dropdownCloseTimers = new Map();

    const resetNestedMenus = (root) => {
        root.querySelectorAll('.navbar-nested').forEach((nested) => {
            nested.classList.remove('is-open');
            const t = nested.querySelector('.navbar-nested-trigger');
            if (t) {
                t.setAttribute('aria-expanded', 'false');
            }
        });
    };

    const closeDropdown = (parent) => {
        parent.classList.remove('is-active');
        resetNestedMenus(parent);
        const btn = parent.querySelector('.navbar-link');
        if (btn) {
            btn.setAttribute('aria-expanded', 'false');
        }
    };

    const closeAllDropdowns = () => {
        dropdownParents.forEach((parent) => {
            clearTimeout(dropdownCloseTimers.get(parent));
            closeDropdown(parent);
        });
    };

    const openDropdown = (parent) => {
        clearTimeout(dropdownCloseTimers.get(parent));
        closeAllDropdowns();
        parent.classList.add('is-active');
        const btn = parent.querySelector('.navbar-link');
        if (btn) {
            btn.setAttribute('aria-expanded', 'true');
        }
    };

    const scheduleClose = (parent) => {
        clearTimeout(dropdownCloseTimers.get(parent));
        const timer = setTimeout(() => {
            closeDropdown(parent);
        }, 160);
        dropdownCloseTimers.set(parent, timer);
    };

    dropdownParents.forEach((parent) => {
        const dropdown = parent.querySelector('.navbar-dropdown');

        parent.addEventListener('mouseenter', () => {
            openDropdown(parent);
        });

        parent.addEventListener('mouseleave', () => {
            scheduleClose(parent);
        });

        if (dropdown) {
            dropdown.addEventListener('mouseenter', () => {
                clearTimeout(dropdownCloseTimers.get(parent));
            });

            dropdown.addEventListener('mouseleave', () => {
                scheduleClose(parent);
            });
        }
    });

    dropdownTriggers.forEach((trigger) => {
        trigger.addEventListener('click', (event) => {
            event.stopPropagation();
            const parent = trigger.closest('.navbar-item.has-dropdown');
            const isActive = parent.classList.contains('is-active');
            if (isActive) {
                closeDropdown(parent);
            } else {
                openDropdown(parent);
            }
        });

        trigger.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                trigger.click();
            }
        });
    });

    document.querySelectorAll('.navbar-nested').forEach((nested) => {
        const trigger = nested.querySelector('.navbar-nested-trigger');
        if (!trigger) {
            return;
        }
        trigger.addEventListener('click', (event) => {
            event.stopPropagation();
            const menu = nested.closest('.navbar-dropdown');
            const willOpen = !nested.classList.contains('is-open');
            if (menu) {
                menu.querySelectorAll('.navbar-nested').forEach((sibling) => {
                    sibling.classList.remove('is-open');
                    const bt = sibling.querySelector('.navbar-nested-trigger');
                    if (bt) {
                        bt.setAttribute('aria-expanded', 'false');
                    }
                });
            }
            if (willOpen) {
                nested.classList.add('is-open');
                trigger.setAttribute('aria-expanded', 'true');
            }
        });
    });

    document.addEventListener('click', () => {
        closeAllDropdowns();
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            closeAllDropdowns();
        }
    });

    initTeaserAutoplaySync();
});

/**
 * Muted autoplay groups: keep all videos in a .sync-group--autoplay aligned in time.
 */
function initTeaserAutoplaySync() {
    document.querySelectorAll('.sync-group--autoplay').forEach((container) => {
        const videos = Array.from(container.querySelectorAll('video'));
        if (videos.length === 0) {
            return;
        }

        videos.forEach((v) => {
            v.controls = false;
            v.setAttribute('playsinline', '');
            v.muted = true;
        });

        if (videos.length === 1) {
            videos[0].play().catch(() => {});
            return;
        }

        function pickMaster() {
            let best = videos[0];
            let bestDur = best.duration && !Number.isNaN(best.duration) ? best.duration : Infinity;
            videos.forEach((v) => {
                const d = v.duration && !Number.isNaN(v.duration) ? v.duration : Infinity;
                if (d < bestDur) {
                    bestDur = d;
                    best = v;
                }
            });
            return best;
        }

        let master = videos[0];
        let syncing = false;

        function syncFollowers() {
            if (syncing) {
                return;
            }
            const t = master.currentTime;
            syncing = true;
            requestAnimationFrame(() => {
                videos.forEach((v) => {
                    if (v === master) {
                        return;
                    }
                    if (Math.abs(v.currentTime - t) > 0.12) {
                        try {
                            v.currentTime = t;
                        } catch (e) {
                            /* ignore */
                        }
                    }
                });
                syncing = false;
            });
        }

        function attachMasterListeners() {
            master.addEventListener('timeupdate', syncFollowers);
            master.addEventListener('seeked', syncFollowers);
        }

        Promise.all(
            videos.map(
                (v) =>
                    new Promise((resolve) => {
                        if (v.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
                            resolve();
                        } else {
                            v.addEventListener('loadeddata', () => resolve(), { once: true });
                            v.addEventListener('error', () => resolve(), { once: true });
                        }
                    })
            )
        ).then(() => {
            master = pickMaster();
            attachMasterListeners();
            videos.forEach((v) => {
                v.play().catch(() => {});
            });
        });
    });
}

function copyBibtex() {
    const bibtexText = `@article{gu26anyflow,
      title={AnyFlow: Any-Step Video Diffusion Model with On-Policy Flow Map Distillation},
      author={Yuchao Gu and Guian Fang and Yuxin Jiang and Weijia Mao and Song Han and Han Cai and Mike Zheng Shou},
      year={2026},
}`;

    navigator.clipboard.writeText(bibtexText).then(() => {
        const btn = document.querySelector('.copy-btn');
        const originalText = btn.textContent;
        btn.textContent = '✓ Copied!';
        btn.style.background = '#27ae60';

        setTimeout(() => {
            btn.textContent = originalText;
            btn.style.background = '#4a90e2';
        }, 2000);
    }).catch(() => {
        alert('Failed to copy BibTeX. Please copy manually.');
    });
}
