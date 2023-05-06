import { BACKEND_PORT } from './config.js';
// A helper you may want to use when uploading new images to the server.
import { fileToDataUrl, throttle } from './helpers.js';

console.log('Let\'s go!');
const url = `http://localhost:${BACKEND_PORT}`;
let latestToken;
let loggedInUserID;
let jobsShown = 0;
let infiniteScroll;
// let currentPage;

/////////////////////////////////////////////
// 2.1. Milestone 1 - Registration & Login //
/////////////////////////////////////////////

document.getElementById('go-to-sign-up').addEventListener('click', () => {
    swapVisibility("login-container", "sign-up-container");
    document.getElementById("popup").classList.add("hidden");
});

document.getElementById('go-to-login').addEventListener('click', () => {
    swapVisibility("sign-up-container", "login-container");
    document.getElementById("popup").classList.add("hidden");
});

const swapVisibility = (id1, id2) => {
    const page1 = document.getElementById(id1);
    const page2 = document.getElementById(id2);
    page1.classList.add("hidden");
    page2.classList.remove("hidden");
    if (id1 === "feed-screen") {
        window.removeEventListener("scroll", infiniteScroll);
    }
    if (id2 === "feed-screen") {
        infiniteScroll = () => {
            throttle(() => {
                const screen = document.getElementById("feed-screen");
                if (window.innerHeight + window.pageYOffset >= screen.offsetHeight + screen.scrollTop + 50) {
                    console.log("load more jobs");
                    loadJobFeed();
                }
            }, 1000);
        };
        window.addEventListener("scroll", infiniteScroll);
    }
}

// 2.1.1. Login
document.getElementById('login-btn').addEventListener('click', () => {
    // Form validation
    const log_in = document.forms['login-form'].elements;
    const email = log_in["login-email"].value;
    const password = log_in["login-password"].value;
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (email === '') {
        displayPopUp("Email cannot be empty");
        return;
    } else if (!regex.test(email)) {
        displayPopUp("Please use email format")
        return;
    } else if (password === '') {
        displayPopUp("Password cannot be empty");
        return;
    } 
    
    logInAPICall(email, password);
    console.log('LOGIN BUTTON PRESSED');
})

// 2.1.2. Registration
document.getElementById('sign-up-btn').addEventListener('click', () => {
    // Form validation
    const sign_up = document.forms['sign-up-form'].elements;
    const email = sign_up["register-email"].value;
    const name = sign_up["register-name"].value;
    const password = sign_up["register-pw1"].value;
    const password2 = sign_up["register-pw2"].value;
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (email === '') {
        displayPopUp("Email cannot be empty");
        return;
    } else if (!regex.test(email)) {
        displayPopUp("Please use email format")
        return;
    } else if (password === '' || password2 === '') {
        displayPopUp("Password cannot be empty");
        return;
    } 

    if (password !== password2) {
        console.log("ERROR: Passwords don't match");
        displayPopUp("Passwords don't match")
    } else {
        registerAPICall(email, password, name);
    }


    console.log('SIGNUP BUTTON PRESSED');
})

const loginSuccess = () => {
    // Hide the login page and load the account page;
    document.getElementById("popup").classList.add("hidden"); // Removes any error popups on login
    swapVisibility("general-login", "feed-screen");
    loadJobFeed();
    unhideNavBar();
    hideLogo();
    // currentPage = "feed-screen";
}

// 2.1.3. Error Popup 
const displayPopUp = (err) => {
    document.getElementById("popup").classList.remove("hidden");
    document.getElementById("popup-info").textContent = err;
};

document.getElementById("close-popup").addEventListener("click", () => {
    document.getElementById("popup").classList.add("hidden");
});

/////////////////////////////////////////////////
// 2.2&2.3 Milestone 2&3 - Basic&Advanced Feed //
/////////////////////////////////////////////////

const loadJobFeed = () => {
    fetch(url + "/job/feed" + `?start=${jobsShown}`, {
        method: 'GET',
        headers: {"accept": "application/json",
        'Authorization': `Bearer ${latestToken}`},
    })
    .then((response) => {
        if (!response.ok) {
            console.log("Response error when loading job feed");
            throw new Error("Invalid Token/Access");
        }
        return response.json();
    })
    .then((data) => {
        console.log("job feed data ", data);
        const jobContainer = document.getElementById("job-feed");
        if (data.length == 0) {
            document.getElementById('no-more-jobs').classList.remove('hidden');
        } else {
            document.getElementById('no-more-jobs').classList.add('hidden');
        }
        for (let job of data) {
            jobsShown++;
            prepareJobFeed(jobContainer, job);
        }
    })
    .catch((err) => {
        console.log("Other error when loading job feed");
        console.log(err);
    });
    console.log('FEED DISPLAYED');
};

document.getElementById("logout-btn").addEventListener('click', () => {
    // reset everything to its default state
    latestToken = undefined;
    loggedInUserID = undefined;
    jobsShown = 0;
    document.getElementById("job-feed").innerText = '';
    // clear the login/sign in inputs
    document.forms['login-form'].reset();
    document.forms['sign-up-form'].reset();
    swapVisibility("feed-screen", "general-login");
    document.getElementById('nav-bar').classList.add('hidden');
    document.getElementById('profile-page').classList.add('hidden');
});

///////////////////////////////////////////////
// 2.4. Milestone 4 - Other users & profiles //
///////////////////////////////////////////////

const loadProfile = (token, userID) => {
    // resets user-watched-by list each time + do it for posts too
    document.getElementById("user-watched-by").innerText = '';
    document.getElementById("user-posts").innerText = '';


    fetch(url + "/user" + `?userId=${userID}`, {
        method: 'GET',
        headers: {"accept": "application/json",
        'Authorization': `Bearer ${token}`},
    })
    .then((response) => {
        if (!response.ok) {
            console.log("Response error when loading user profile");
            throw new Error("Invalid Token/Access");
        }
        return response.json();
    })
    .then((data)=> {
        console.log("user profile data ", data);
        document.getElementById("dp-img").src = data.image;
        document.getElementById("user-name").innerText = data.name;
        document.getElementById("user-email").innerText = data.email;
        document.getElementById("watched-by-count").innerText = `Watched by ${data.watcheeUserIds.length}`;

        // Get the list of watchees
        let userWatchedByContainer = document.getElementById("user-watched-by");
        data.watcheeUserIds.forEach(watcheeUserId => {
            let div = document.createElement("div");
            let button = document.createElement("button");
            
            fetch(url + "/user" + `?userId=${watcheeUserId}`, {
                method: 'GET',
                headers: {"accept": "application/json",
                'Authorization': `Bearer ${latestToken}`},
            })
            .then((response) => {
                if (!response.ok) {
                    console.log("Response error when loading watchee profile");
                    throw new Error("Invalid Token/Access");
                }
                return response.json();
            })
            .then((data)=> {
                button.textContent = data.name;
            })
            .catch((err) => {
                console.log("Other error when loading watchee profile");
                console.log(err);
            });

            button.classList.add("user-watched-by-item");
            
            div.appendChild(button);
            userWatchedByContainer.appendChild(div);

            button.addEventListener("click", () => {
                console.log("Profile clicked: " + watcheeUserId);
                loadProfile(latestToken, watcheeUserId);
            });
        });

        // User Posts
        console.log("user jobs posted data ", data.jobs);
        const jobContainer = document.getElementById("user-posts");
        if (data.jobs.length == 0) {
            document.getElementById('no-posts').classList.remove('hidden');
        } else {
            document.getElementById('no-posts').classList.add('hidden');
        }
        for (let job of data.jobs) {
            jobsShown++;
            prepareJobFeed(jobContainer, job);
        }
            
        // Watch Button
        let isWatched = data.watcheeUserIds.includes(loggedInUserID);

        document.getElementById("dark-mode-btn").classList.add("hidden");
        document.getElementById("update-btn").classList.add("hidden");
        document.getElementById("watch-btn").classList.add("hidden");
        
        if (userID === loggedInUserID) {
            document.getElementById("update-btn").classList.remove("hidden");
            document.getElementById("dark-mode-btn").classList.remove("hidden");
        } else if (isWatched) {
            document.getElementById("watch-btn").innerText = "Unwatch";
            document.getElementById("watch-btn").classList.remove("hidden");
        } else {
            document.getElementById("watch-btn").innerText = "Watch";
            document.getElementById("watch-btn").classList.remove("hidden");
        }

        document.getElementById("watch-btn").addEventListener('click', () => {
            let turnon;
            if (document.getElementById("watch-btn").innerText === 'Watch') {
                turnon = true;
            } else {
                turnon = false;
            }
            watchUnwatchUserAPICall(latestToken, data.email, turnon)
        });

    })
    .catch((err) => {
        console.log("Other error when loading user profile");
        console.log(err);
    });
    console.log('PROFILE LOADED');
};

document.getElementById("my-profile").addEventListener('click', () => {
    swapVisibility("feed-screen", "profile-page");
    loadProfile(latestToken, loggedInUserID);
});

document.getElementById("profile-to-feed-link").addEventListener('click', () => {
    swapVisibility("profile-page", "feed-screen");
});

// Watch/Unwatch User Helper
const watchUnwatchUserAPICall = (token, userToWatch, turnon) => {
    fetch(url + "/user/watch", {
        method: 'PUT',
        headers: {"Content-Type": "application/json",
        'Authorization': `Bearer ${token}`},
        body: JSON.stringify({email: userToWatch, turnon: turnon})
    })
    .then((response) => {
        if (!response.ok) {
            console.log("Cannot Watch User");
            displayPopUp("Cannot watch User");
        }
        console.log("Watched User");
        return response.json();
    })
    .then((data) => {
        console.log(data);
    })
    .catch((err) => {
        console.log(`ERROR: ${err}`);
    });
}

document.getElementById("search-for-user-button").addEventListener('click', (event)=> {
    event.preventDefault();
    let userSearched = document.getElementById("user-searched").value
    const turnon = true;
    watchUnwatchUserAPICall(latestToken, userSearched, turnon);
});

// Update Form 
document.getElementById("update-btn").addEventListener('click', () => {
    swapVisibility("profile-page", "update-user-profile-form");
});
document.getElementById("save-updates").addEventListener('click', (event) => {
    event.preventDefault();

    const image = document.getElementById('new-dp').files;

    if (image.length === 0) {
        const email = document.getElementById("new-email-address").value;
        const password = document.getElementById("new-password").value;
        const name = document.getElementById("new-name").value;
        let base64Str = undefined

        fetch(url + "/user", {
            method: 'PUT',
            headers: {'Content-Type': 'application/json',
            'Authorization': `Bearer ${latestToken}`},
            body: JSON.stringify({"email": email, "password": password, "name": name, "image": base64Str}),
        }).then((response) => {
            if (!response.ok) {
                alert("Error updating your user info :(");
            } else {
                alert("Successfully updated your user info :)");
                document.forms['update-user-profile-form'].reset();
            }
        })
        .catch((err) => {
            console.log(err);
            console.log("error when updating user info");
        });
    } else {
        fileToDataUrl(image[0])
        .then((base64Str) => {
            const email = document.getElementById("new-email-address").value;
            const password = document.getElementById("new-password").value;
            const name = document.getElementById("new-name").value;
            fetch(url + "/user", {
                method: 'PUT',
                headers: {'Content-Type': 'application/json',
                'Authorization': `Bearer ${latestToken}`},
                body: JSON.stringify({"email": email, "password": password, "name": name, "image": base64Str}),
            }).then((response) => {
                if (!response.ok) {
                    alert("Error updating your user info :(");
                } else {
                    alert("Successfully updated your user info :)");
                    document.forms['update-user-profile-form'].reset();
                }
            })
            .catch((err) => {
                console.log(err);
                console.log("error when updating user info");
            });
        }).catch((err) => {
            console.log(err);
            console.log("error when turning file to date in updating user info");
        });
    }
    loadProfile(latestToken, loggedInUserID);
    swapVisibility("update-user-profile-form", "profile-page");
});
document.getElementById("cancel-updates").addEventListener('click', (event) => {
    event.preventDefault();
    document.getElementById("update-user-profile-form").reset();
    swapVisibility("update-user-profile-form", "profile-page");
});

//////////////////////////////////////////////////
// 2.5. Milestone 5 - Adding & updating content //
//////////////////////////////////////////////////

// 2.5.1
// Making form validation look nice
const invalid = (targetElement, feedbackElement, feedbackMessage) => {
    targetElement.classList.add('is-invalid');
    targetElement.classList.remove('is-valid');
    feedbackElement.innerText = feedbackMessage;
    feedbackElement.classList.add("invalid-feedback");
    feedbackElement.classList.remove("valid-feedback");
};

const valid = (targetElement, feedbackElement) => {
    targetElement.classList.remove('is-invalid');
    targetElement.classList.add('is-valid');
    feedbackElement.innerText = "Looks good!";
    feedbackElement.classList.remove("invalid-feedback");
    feedbackElement.classList.add("valid-feedback");
};

const checkTitle = (titleElement, feedbackElement) => {
    if (titleElement.value === '') {
        invalid(titleElement, feedbackElement, "Please enter a title");
        return false;
    } else {
        valid(titleElement, feedbackElement);
        return true;
    }
};

const checkDate = (dateElement, feedbackElement) => {
    const now = new Date();
    const newDate = new Date(dateElement.value);
    if (dateElement.value === '' || newDate - now < 0) {
        invalid(dateElement, feedbackElement, "Please enter a date that is not in the past");
        return false;
    } else {
        valid(dateElement, feedbackElement);
        return true;
    }
};

const checkDesc = (descElement, feedbackElement) => {
    if (descElement.value === '') {
        invalid(descElement, feedbackElement, "Please enter a job description");
        return false;
    } else {
        valid(descElement, feedbackElement);
        return true;
    }
};

const checkImg = (imgElement, feedbackElement) => {
    if (imgElement.value === '') {
        invalid(imgElement, feedbackElement, "Please add a job image");
        return false;
    } else {
        valid(imgElement, feedbackElement);
        return true;
    }
};

let newJobTitleValid = false;
const newJobTitle = document.getElementById('new-job-title');
newJobTitle.addEventListener('keyup', () => {
    const feedback = document.getElementById('new-job-title-feedback');
    newJobTitleValid = checkTitle(newJobTitle, feedback);
    checkNewJob();
});

let newJobDateValid = false;
const newJobDate = document.getElementById('new-job-start');
newJobDate.addEventListener('change', () => {
    const feedback = document.getElementById('new-job-start-feedback');
    newJobDateValid = checkDate(newJobDate, feedback);
    checkNewJob();
});

let newJobDescValid = false;
const newJobDesc = document.getElementById('new-job-desc');
newJobDesc.addEventListener('keyup', () => {
    const feedback = document.getElementById('new-job-desc-feedback');
    newJobDescValid = checkDesc(newJobDesc, feedback);
    checkNewJob();
});

let newJobImgValid = false;
const newJobImage = document.getElementById('new-job-img');
newJobImage.addEventListener('change', () => {
    const feedback = document.getElementById('new-job-img-feedback');
    newJobImgValid = checkImg(newJobImage, feedback);
    checkNewJob();
});

const checkNewJob = () => {
    if (newJobTitleValid && newJobDateValid && newJobDescValid && newJobImgValid) {
        document.getElementById('post-job-btn').disabled = false;
    } else {
        document.getElementById('post-job-btn').disabled = true;
    }
};

// Form validation
document.getElementById('post-job-btn').addEventListener('click', () => {
    // Since the button should be disabled if the inputs are invalid, we can
    // assume that the button is pressed with valid inputs.
    const image = document.getElementById('new-job-img').files;
    if (image.length === 0) {
        return;
    } else {
        const title = newJobTitle.value;
        const desc = newJobDesc.value;
        const date = newJobDate.value;
        postJobAPICall(image[0], title, date, desc);
    }

});

// 2.5.2
// Making form validation look nice
let editJobTitleValid = true;
const editJobTitle = document.getElementById('edit-job-title');
editJobTitle.addEventListener('keyup', () => {
    const feedback = document.getElementById('edit-job-title-feedback');
    editJobTitleValid = checkTitle(editJobTitle, feedback);
    checkEditJob();
})

let editJobDateValid = true;
const editJobDate = document.getElementById('edit-job-start');
editJobDate.addEventListener('change', () => {
    const feedback = document.getElementById('edit-job-start-feedback');
    editJobDateValid = checkDate(editJobDate, feedback);
    checkEditJob();
})

let editJobDescValid = true;
const editJobDesc = document.getElementById('edit-job-desc');
editJobDesc.addEventListener('keyup', () => {
    const feedback = document.getElementById('new-job-desc-feedback');
    editJobDescValid = checkDesc(editJobDesc, feedback);
    checkEditJob();
});

const checkEditJob = () => {
    if (editJobTitleValid && editJobDateValid && editJobDescValid) {
        document.getElementById('confirm-job-edit').disabled = false;
    } else {
        document.getElementById('confirm-job-edit').disabled = true;
    }
};

const logInAPICall = (email, password) => {
    fetch(url + "/auth/login", {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({email, password})
    }).then((response) => {
        if (!response.ok) {
            console.log("Response error");
            displayPopUp("Invalid Email or Password");
            throw new Error("Invalid Email or Password");
        }
        return response.json();
    }).then((data) => {
        console.log("log in data ", data);
        console.log("--------------------");
        latestToken = data.token;
        loggedInUserID = data.userId;
        jobsShown = 0;
        loginSuccess();
    }).catch((err) => {
        console.log(`ERROR: ${err}`);
        displayPopUp(err);
    });
};

const registerAPICall = (email, password, name) => {
    fetch(url + "/auth/register", {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({email, password, name})
    })
    .then((response) => {
        if (!response.ok) {
            console.log("Response error");
            displayPopUp("Email address already registered")
            throw new Error("Email address already registered");
        }
        return response.json();
    })
    .then((data) => {
        console.log("sign up data ", data);
        latestToken = data.token;
        loggedInUserID = data.userId;
        jobsShown = 0;
        swapVisibility("sign-up-container", "login-container");
        loginSuccess(latestToken);
    })
    .catch((err) => {
        console.log(`ERROR: ${err}`);
        displayPopUp(err);
    });
};

const postJobAPICall = (image, title, date, desc) => {
    fileToDataUrl(image)
    .then((base64Str) => {
        fetch(url + "/job", {
            method: 'POST',
            headers: {'Content-Type': 'application/json',
            'Authorization': `Bearer ${latestToken}`},
            body: JSON.stringify({"title": title, "image": base64Str, "start": date, "description": desc}),
        }).then((response) => {
            if (!response.ok) {
                alert("Error posting your new job :(");
            } else {
                alert("Successfully posted your job :)");
                document.forms['new-job-form'].reset();
                newJobImage.classList.remove('is-valid');
                document.getElementById('new-job-img-feedback').innerText = '';
                document.getElementById('new-job-img-feedback').classList.remove("valid-feedback");
                newJobDesc.classList.remove('is-valid');
                newJobDate.classList.remove('is-valid');
                newJobTitle.classList.remove('is-valid');
                document.getElementById('new-job-desc-feedback').innerText = '';
                document.getElementById('new-job-desc-feedback').classList.remove("valid-feedback");
                document.getElementById('new-job-title-feedback').innerText = '';
                document.getElementById('new-job-title-feedback').classList.remove("valid-feedback");
                document.getElementById('new-job-start-feedback').innerText = '';
                document.getElementById('new-job-start-feedback').classList.remove("valid-feedback");
            }
        })
        .catch((err) => {
            console.log(err);
            console.log("error when posting new job");
        });
    }).catch((err) => {
        console.log(err);
        console.log("error when turning file to data in new job");
    });
};

const editJobNewImageAPICall = (image, title, date, desc, showEdit, jobId, jobElement) => {
    console.log("Function 2 being run");
    fileToDataUrl(image)
    .then((base64Str) => {
        editJobAPICall(base64Str, title, date, desc, showEdit, jobId, jobElement);
    }).catch((err) => {
        console.log(err);
        console.log("error when turning file to data when editing job");
    });
};

const editJobAPICall = (image, title, date, desc, showEdit, jobId, jobElement) => {
    fetch(url + "/job", {
        method: 'PUT',
        headers: {'Content-Type': 'application/json',
        'Authorization': `Bearer ${latestToken}`},
        body: JSON.stringify({"id": jobId, "title": title, "image": image, "start": date, "description": desc}),
    }).then((response) => {
        if (!response.ok) {
            alert("Error editting your job :(");
        } else {
            alert("Successfully edited your job :)");
            console.log("ZZZZZ");
            document.forms['edit-job-form'].reset();
            showEdit.innerText = "(Edited)";
            // Amend job posting live
            amendJob(undefined, title, date, desc, jobElement);
        }
    })
    .catch((err) => {
        console.log(err);
        console.log("error when editing a job");
    });
};

let currDeleteId;
let currDeleteTarget;
document.getElementById('confirm-job-delete').addEventListener('click', () => {
    console.log("deleting job");
    jobDeleteAPICall(currDeleteId, currDeleteTarget);
});

const jobDeleteAPICall = (jobId, target) => {
    fetch(url + '/job', {
        method: 'DELETE',
        headers: {'Content-Type': 'application/json',
        'Authorization': `Bearer ${latestToken}`},
        body: JSON.stringify({'id': jobId})
    }).then((response) => {
        if (!response.ok) {
            console.log("Response error when deleting on a job");
            throw new Error("Invalid Token / Permissions");
        } else {
            console.log("Job just deleted");
            // Include a popup showing the job was deleted
            alert("Job sucessfully deleted");
            target.remove();
        }
    }).catch((err) => {
        console.log("Other error");
        console.log(err);
        alert("Something went wrong when deleting that post");
    });
};

const jobLikeAPICall = (jobId, isLiking) => {
    fetch(url + "/job/like", {
        method: 'PUT',
        headers: {'Content-Type': 'application/json',
        'Authorization': `Bearer ${latestToken}`},
        body: JSON.stringify({"id": jobId, "turnon": isLiking}),
    }).then((response) => {
        if (!response.ok) {
            console.log("Response error when liking a job");
            throw new Error("Invalid Token / Input");
        }
    }).catch((err) => {
        console.log("Other error");
        console.log(err);
    });
};

const getPostCreatorInfoAPICall = (creatorId, targetDiv, postedAgo) => {
    fetch(url + `/user?userId=${creatorId}`, {
        method: 'GET',
        headers: {"accept": "application/json",
        'Authorization': `Bearer ${latestToken}`},
    }).then((response) => {
        if (!response.ok) {
            console.log("Response error when retrieving user data");
            throw new Error("Invalid Token/Access");
        }
        return response.json();
    }).then((data) => {
        targetDiv.innerText = `${data.name} · ${data.email} · ${postedAgo}`;
    })
    .catch((err) => {
        console.log("Other error");
        console.log(err);
    });
};

const postCommentAPICall = (jobId, commentInput, postButton) => {
    fetch(url + "/job/comment", {
        method: 'POST',
        headers: {'Content-Type': 'application/json',
        'Authorization': `Bearer ${latestToken}`},
        body: JSON.stringify({"id": jobId, "comment": commentInput.value}),
    }).then((response) => {
        if (!response.ok) {
            console.log("Response error when commenting on a job");
            alert("Unable to post comment :(");
            throw new Error("Invalid Token / Input");
        } else {
            console.log("comment just posted");
            commentInput.value = "";
            postButton.disabled = true;
            alert("Comment sucessfully posted");
        }
    }).catch((err) => {
        console.log("Other error");
        console.log(err);
        alert("Something went wrong when posting that comment");
    });
};

const loadComment = (commentData, commentListElement) => {
    const commentTemplate = document.getElementById("comment-template").cloneNode(true);
    commentTemplate.removeAttribute("id");
    commentTemplate.classList.remove("hidden");
    commentTemplate.childNodes[1].innerText = commentData.userName;
    jobToProfileLink(commentTemplate.childNodes[1], commentData.userId);
    commentTemplate.childNodes[3].innerText = commentData.userEmail;
    commentTemplate.childNodes[5].innerText = commentData.comment;
    commentListElement.appendChild(commentTemplate);
};

const loadLikeList = (container, likesArray) => {
    const likeStringElement = document.getElementById('user-comment-hyperlink').cloneNode(false);
    likeStringElement.removeAttribute('id');
    likeStringElement.classList.remove('hidden');
    likeStringElement.classList.remove('comment-link')
    if (likesArray.length === 0) {
        likeStringElement.innerText = "Be the first to like this job!";
        container.appendChild(likeStringElement);
    } else if (likesArray.length === 1) {
        likeStringElement.innerText = "Liked by ";
        container.appendChild(likeStringElement);
        const userLike = commentToProfileLink(likesArray[0].userEmail, likesArray[0].userId);
        container.appendChild(userLike);
    } else {
        likeStringElement.innerText = "Liked by ";
        container.appendChild(likeStringElement);
        for (let i in likesArray) {
            let userLike;
            if (i == (likesArray.length - 1)) {
                userLike = commentToProfileLink(`and ${likesArray[i].userEmail}`, likesArray[i].userId);
            } else {
                userLike = commentToProfileLink(`${likesArray[i].userEmail}, `, likesArray[i].userId);
            }
            container.appendChild(userLike);
        }
    }
}

const calcNumLikes = (likesArray) => {
    let numLikes;
    if (likesArray.length === 1) {
        numLikes = ` ${likesArray.length} like `;
    } else {
        numLikes = ` ${likesArray.length} likes `;
    }
    return numLikes;
};

const calcTimeSincePosted = (createdAt) => {
    // Calculate the difference between today and createdAt
    const today = new Date();
    // console.log(today);
    const created = new Date(createdAt);
    // console.log(created);
    const daysBetween = (today - created) / (1000 * 60 * 60 * 24);
    let postedAgo;
    if (daysBetween <= 1) {
        const hours = Math.floor((today - created) / (1000 * 60 * 60));
        const min = Math.floor(((today - created) / (1000 * 60)) % 60);
        if (hours === 0 && min === 0) {
            postedAgo = "posted less than a minute ago";
        } else if (hours === 0) {
            postedAgo = `posted ${min} minutes ago`;
        } else {
            postedAgo = `posted ${hours} hours and ${min} min ago`;
        }
    } else {
        postedAgo = `posted on ${createdAt.substring(0, 10)}`;
    }

    return postedAgo;
};

const calcNumComments = (commentArray) => {
    let numComments;
    if (commentArray.length === 1) {
        numComments = ` ${commentArray.length} comment `;
    } else {
        numComments = ` ${commentArray.length} comments `;
    }

    return numComments;
};

const amendJob = (image, title, date, desc, jobElement) => {
    if (image) {
        setJobImage(image, jobElement, undefined);
    }
    setJobTitle(title, jobElement);
    setJobStart(date, jobElement);
    setJobDesc(desc, jobElement);
};

const setJobImage = (image, jobElement, altText) => {
    if (altText) {
        jobElement.childNodes[1].childNodes[1].childNodes[1].alt = altText;
    }
    jobElement.childNodes[1].childNodes[1].childNodes[1].src = image;
};

const setJobTitle = (title, jobElement) => {
    jobElement.childNodes[1].childNodes[3].childNodes[1].innerText = title;  
};

const setJobStart = (date, jobElement) => {
    jobElement.childNodes[1].childNodes[3].childNodes[7].innerText = `Starting date: ${date.substring(0,10)}`;
};

const setJobDesc = (desc, jobElement) => {
    jobElement.childNodes[3].childNodes[1].innerText = desc;
}

const unhideNavBar = () => {
    document.getElementById('nav-bar').classList.remove('hidden');
}

const prepareJobFeed = (containerElement, job) => {
    // Clone the job listing template
    const jobTemplate = document.getElementById("job-template").cloneNode(true);
    jobTemplate.removeAttribute("id");
    jobTemplate.classList.remove("hidden");
    const jobDetails = jobTemplate.childNodes[1];
    setJobImage(job.image, jobTemplate, `image for ${job.title}`);

    const jobTextDetails = jobDetails.childNodes[3];
    setJobTitle(job.title, jobTemplate);

    // Calculate the difference between today and createdAt
    const postedAgo = calcTimeSincePosted(job.createdAt);

    // Get the details of the creator
    const creatorDetailDiv = jobTextDetails.childNodes[3];
    getPostCreatorInfoAPICall(job.creatorId, creatorDetailDiv, postedAgo);
    jobToProfileLink(creatorDetailDiv, job.creatorId);

    setJobStart(job.start, jobTemplate);
    setJobDesc(job.description, jobTemplate);

    const likes = jobTemplate.childNodes[3].childNodes[3].childNodes[1].childNodes[3];
    const comments = jobTemplate.childNodes[3].childNodes[3].childNodes[3].childNodes[3];

    likes.innerText = calcNumLikes(job.likes);
    const likeList = jobTemplate.childNodes[3].childNodes[3].childNodes[1].childNodes[5];

    // likeList.innerText = loadLikeList(likeList, job.likes);
    loadLikeList(likeList, job.likes);
    console.log(likeList);
    likes.addEventListener('click', () => {
        likeList.classList.toggle('hidden');
    });

    comments.innerText = calcNumComments(job.comments);
    const commentList = jobTemplate.childNodes[9];
    const textUnderCommentButton = jobTemplate.childNodes[3].childNodes[3].childNodes[3].childNodes[5];
    if (job.comments.length === 0) {
        textUnderCommentButton.innerText = "Be the first to comment on this job!";
    } else {
        textUnderCommentButton.innerText = "";
        for (let comment of job.comments) {
            loadComment(comment, commentList);
        }
    }

    comments.addEventListener('click', () => {
        commentList.classList.toggle('hidden');
        textUnderCommentButton.classList.toggle('hidden');
    });
    // Check if user has already liked the post to pre toggle like button if needed:
    let alreadyLiked = false;
    for (let likes of job.likes) {
        if (likes.userId === loggedInUserID) {
            alreadyLiked = true;
            break;
        }
    }
    const likeButton = jobTemplate.childNodes[7].childNodes[1].childNodes[1];
    if (alreadyLiked) {
        likeButton.classList.add('active');
        likeButton.ariaPressed = "true";
        likeButton.value = "Unlike";
    }
    likeButton.addEventListener('click', () => {
        let isLiking;
        if (likeButton.value === 'Like') {
            isLiking = true;    
        } else {
            isLiking = false;
        }
        
        console.log("A like has been sent: ", isLiking);
        jobLikeAPICall(job.id, isLiking)

        if (isLiking) {
            likeButton.value = "Unlike";
        } else {
            likeButton.value = "Like";
        }
    });

    const commentInput = jobTemplate.childNodes[7].childNodes[3].childNodes[1];
    const postButton = jobTemplate.childNodes[7].childNodes[5].childNodes[1];
    commentInput.addEventListener('keyup', () => {
        if (commentInput.value === "") {
            postButton.disabled = true;
        } else {
            postButton.disabled = false;
        }
    });

    postButton.addEventListener('click', () => {
        postCommentAPICall(job.id, commentInput, postButton);
    });

    // If the user is the creator, then they should be able to edit/delete jobs
    if (job.creatorId === loggedInUserID) {
        const editJobDiv = jobTemplate.childNodes[7].childNodes[7];
        editJobDiv.classList.remove('hidden');
        const editJobBtn = editJobDiv.childNodes[1];
        editJobBtn.addEventListener('click', () => {
            document.getElementById('edit-job-title').value = job.title;
            document.getElementById('edit-job-start').value = job.start;
            document.getElementById('edit-job-desc').value = job.description;
            // Note: Cannot pre-load an input type='file'
            document.getElementById('edit-job-img-original').src = job.image;
            targetTemplate = jobTemplate;
            targetEditField = jobTextDetails.childNodes[5];
            jobIdToEdit = job.id;
        });
        
        const deletePostDiv = jobTemplate.childNodes[7].childNodes[9];
        deletePostDiv.classList.remove('hidden');
        const deleteJobBtn = deletePostDiv.childNodes[1];
        deleteJobBtn.addEventListener('click', () => {
            document.getElementById('delete-job-label').innerText = `Delete this job for ${job.title}?`;
            currDeleteId = job.id;
            currDeleteTarget = jobTemplate;
        });
    }

    containerElement.appendChild(jobTemplate);
}

const hideLogo = () => {
    document.getElementById('intro-header').classList.add('hidden');
};

const jobToProfileLink = (target, id) => {
    target.role = "button";
    target.addEventListener('click', () => {
        loadProfile(latestToken, id);
        swapVisibility("feed-screen", "profile-page");
    });
};

const commentToProfileLink = (string, id) => {
    const userLike = document.getElementById('user-comment-hyperlink').cloneNode(false);
    userLike.removeAttribute('id');
    userLike.classList.remove('hidden');
    userLike.innerText = string;
    jobToProfileLink(userLike, id);
    return userLike;
}
let targetTemplate;
let targetEditField;
let jobIdToEdit;
document.getElementById('confirm-job-edit').addEventListener('click', () => {
    console.log("Edit Job Button pressed");
    const image = document.getElementById('edit-job-img').files;
    const title = document.getElementById('edit-job-title').value;
    const desc = document.getElementById('edit-job-desc').value;
    const date = document.getElementById('edit-job-start').value
    const original = document.getElementById('edit-job-img-original').src;
    if (image.length === 0) {
        // If no image is provided, keep the original image
        editJobAPICall(original, title, date, desc, targetEditField, jobIdToEdit, targetTemplate);
    } else {
        // Otherwise, use new image
        editJobNewImageAPICall(image[0], title, date, desc, targetEditField, jobIdToEdit, targetTemplate);
    }
});

// Extra Features: Dark Mode

document.getElementById("dark-mode-btn").addEventListener('click', () =>  {
    const body = document.querySelector('body');
    body.classList.toggle('dark-mode');
});