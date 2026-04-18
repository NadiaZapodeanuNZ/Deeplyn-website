::: users.models.User
    options:
        show_root_heading: true

::: users.models.EmailVerification
    options:
        members:
            - is_token_expired
            - is_blocked
            - generate_new_token
        show_root_heading: true